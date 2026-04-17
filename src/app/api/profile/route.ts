import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { profileSchema } from "@/utils/validation";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currentDegree: true,
        currentSchool: true,
        graduationDate: true,
        gpa: true,
        researchInterests: true,
        industryYears: true,
        skills: true,
        linkedinUrl: true,
        githubUrl: true,
        cvUrl: true,
        transcriptUrl: true,
        targetTerm: true,
        targetCountry: true,
        targetCountries: true,
        fundingRequired: true,
        willingToSelfFund: true,
        willingToRelocate: true,
        visaStatus: true,
        citizenCountry: true,
        onboardingCompleted: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
      },
    });
    return apiResponse(dbUser);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = profileSchema.partial().parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        currentDegree: data.currentDegree,
        currentSchool: data.currentSchool,
        gpa: data.gpa,
        researchInterests: data.researchInterests,
        industryYears: data.industryYears,
        skills: data.skills,
        targetTerm: data.targetTerm,
        targetCountry: data.targetCountry,
        fundingRequired: data.fundingRequired,
        willingToSelfFund: data.willingToSelfFund,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
      },
    });

    await auditLog(user.id, "PROFILE_UPDATED");

    return apiResponse({
      id: updated.id,
      name: updated.name,
      email: updated.email,
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Update failed"));
  }
}
