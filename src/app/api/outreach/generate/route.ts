import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError } from "@/lib/errors";
import { generateOutreachEmail } from "@/services/ai/emailGenerator";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { getAiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { success } = await checkRateLimit(getAiLimiter(), user.id);
    if (!success) throw new RateLimitError();

    const { professorId, emailType = "COLD_OUTREACH" } = await req.json();

    const [professor, dbUser] = await Promise.all([
      prisma.professor.findUnique({
        where: { id: professorId },
        include: {
          university: true,
          publications: { orderBy: { year: "desc" }, take: 3 },
          fundingSources: { where: { status: "Active" } },
        },
      }),
      prisma.user.findUnique({ where: { id: user.id } }),
    ]);

    if (!professor) throw new NotFoundError("Professor");

    const email = await generateOutreachEmail({
      professorName: professor.name,
      universityName: professor.university.name,
      department: professor.department,
      researchAreas: professor.researchAreas,
      recentPapers: professor.publications.map((p) => ({
        title: p.title,
        summary: p.summary,
      })),
      activeGrants: professor.fundingSources.map((g) => ({
        title: g.title,
        agency: g.agency,
      })),
      studentName: dbUser?.name ?? "Student",
      studentDegree: dbUser?.currentDegree ?? null,
      studentSchool: dbUser?.currentSchool ?? null,
      studentInterests: dbUser?.researchInterests ?? [],
      studentSkills: dbUser?.skills ?? [],
      studentIndustryYears: dbUser?.industryYears ?? null,
      emailType,
    });

    await auditLog(user.id, "EMAIL_GENERATED", { professorId });

    return apiResponse(email);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
