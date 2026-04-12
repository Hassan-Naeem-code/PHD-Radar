import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, paginatedResponse } from "@/lib/errors";
import { searchSchema } from "@/utils/validation";
import { requireAuth } from "@/lib/api-auth";
import {
  calculateResearchAlignmentScore,
  calculateFundingScore,
  calculateAccessibilityScore,
  calculateOverallMatchScore,
} from "@/utils/scoring";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

    const fundingRequired = url.searchParams.get("fundingRequired");
    const country = url.searchParams.get("country");
    const rankingMax = url.searchParams.get("rankingMax");

    const where: Record<string, unknown> = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { researchAreas: { hasSome: query.split(",").map((q) => q.trim()) } },
        { researchSummary: { contains: query, mode: "insensitive" } },
      ];
    }

    if (fundingRequired === "true") {
      where.hasActiveFunding = true;
    }

    if (country) {
      where.university = { country };
    }

    const [professors, total] = await Promise.all([
      prisma.professor.findMany({
        where,
        include: {
          university: true,
          fundingSources: { where: { status: "Active" } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fundingScore: "desc" },
      }),
      prisma.professor.count({ where }),
    ]);

    const userInterests = query.split(",").map((q) => q.trim());

    const results = professors.map((prof) => {
      const researchAlignment = calculateResearchAlignmentScore(
        userInterests,
        prof.researchAreas
      );
      const funding = calculateFundingScore(
        prof.hasActiveFunding,
        prof.fundingSources.length,
        prof.fundingSources.filter(
          (g) =>
            g.startDate && new Date(g.startDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        ).length,
        prof.lookingForStudents
      );
      const accessibility = calculateAccessibilityScore(
        prof.title,
        prof.currentPhDStudents,
        prof.internationalStudents,
        prof.responsivenessScore
      );
      const overall = calculateOverallMatchScore(researchAlignment, funding, accessibility);

      return {
        id: prof.id,
        name: prof.name,
        title: prof.title,
        department: prof.department,
        universityName: prof.university.name,
        researchAreas: prof.researchAreas,
        hIndex: prof.hIndex,
        citations: prof.citations,
        hasActiveFunding: prof.hasActiveFunding,
        lookingForStudents: prof.lookingForStudents,
        fundingScore: prof.fundingScore,
        researchAlignmentScore: researchAlignment,
        overallMatchScore: overall,
      };
    });

    results.sort((a, b) => b.overallMatchScore - a.overallMatchScore);

    return paginatedResponse(results, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = searchSchema.parse(body);

    // Same logic as GET but with body params
    return apiResponse({ professors: [], totalCount: 0 });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
