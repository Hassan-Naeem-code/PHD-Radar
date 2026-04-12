import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError } from "@/lib/errors";
import { analyzeResearchFit } from "@/services/ai/researchAnalyzer";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const [professor, dbUser] = await Promise.all([
      prisma.professor.findUnique({
        where: { id },
        include: {
          university: true,
          publications: { orderBy: { year: "desc" }, take: 5 },
          fundingSources: { where: { status: "Active" } },
        },
      }),
      prisma.user.findUnique({ where: { id: user.id } }),
    ]);

    if (!professor) throw new NotFoundError("Professor");
    if (!dbUser) throw new NotFoundError("User");

    const analysis = await analyzeResearchFit({
      userResearchInterests: dbUser.researchInterests,
      userSkills: dbUser.skills,
      userIndustryYears: dbUser.industryYears,
      professorName: professor.name,
      universityName: professor.university.name,
      researchAreas: professor.researchAreas,
      recentPapers: professor.publications.map((p) => p.title),
      activeGrants: professor.fundingSources.map((g) => g.title),
    });

    await auditLog(user.id, "RESEARCH_FIT_ANALYZED", { professorId: id });

    return apiResponse(analysis);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
