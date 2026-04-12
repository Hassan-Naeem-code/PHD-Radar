import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentDegree: body.currentDegree || undefined,
        currentSchool: body.currentSchool || undefined,
        gpa: body.gpa ? parseFloat(body.gpa) : undefined,
        researchInterests: body.researchAreas || undefined,
        industryYears: body.industryYears ? parseInt(body.industryYears) : undefined,
        skills: body.skills || undefined,
        targetTerm: body.targetTerm || undefined,
        fundingRequired: body.fundingPreference === "yes",
        willingToSelfFund: body.fundingPreference === "no",
        onboardingCompleted: true,
      },
    });

    await auditLog(user.id, "ONBOARDING_COMPLETED");

    return apiResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
