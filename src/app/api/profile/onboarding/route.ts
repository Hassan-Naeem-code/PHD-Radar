import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { degreeType, targetTerm, researchAreas, researchDescription, fundingPreference, currentDegree, currentSchool, gpa, industryYears, skills } = body;

    // In production, get userId from session
    // For now, return success
    return apiResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
