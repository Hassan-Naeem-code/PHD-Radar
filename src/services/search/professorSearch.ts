import { prisma } from "@/lib/prisma";
import {
  calculateResearchAlignmentScore,
  calculateFundingScore,
  calculateAccessibilityScore,
  calculateOverallMatchScore,
} from "@/utils/scoring";
import type { ProfessorResult, SearchFilters } from "@/types";

export async function searchProfessors(
  query: string,
  filters: SearchFilters = {},
  userInterests: string[] = [],
  page = 1,
  pageSize = 20
): Promise<{ results: ProfessorResult[]; total: number }> {
  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { researchSummary: { contains: query, mode: "insensitive" } },
      { department: { contains: query, mode: "insensitive" } },
    ];
  }

  if (filters.fundingRequired) {
    where.hasActiveFunding = true;
  }

  if (filters.lookingForStudents) {
    where.lookingForStudents = true;
  }

  if (filters.country) {
    where.university = { ...((where.university as object) || {}), country: filters.country };
  }

  if (filters.rankingMax) {
    where.university = {
      ...((where.university as object) || {}),
      csRanking: { lte: filters.rankingMax },
    };
  }

  if (filters.minFundingScore) {
    where.fundingScore = { gte: filters.minFundingScore };
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
    }),
    prisma.professor.count({ where }),
  ]);

  const searchTerms = query ? query.split(",").map((t) => t.trim()) : [];
  const interests = userInterests.length > 0 ? userInterests : searchTerms;

  const results: ProfessorResult[] = professors.map((prof) => {
    const researchAlignment = calculateResearchAlignmentScore(
      interests,
      prof.researchAreas
    );
    const funding = calculateFundingScore(
      prof.hasActiveFunding,
      prof.fundingSources.length,
      prof.fundingSources.filter(
        (g) =>
          g.startDate &&
          new Date(g.startDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      ).length,
      prof.lookingForStudents
    );
    const accessibility = calculateAccessibilityScore(
      prof.title,
      prof.currentPhDStudents,
      prof.internationalStudents,
      prof.responsivenessScore
    );
    const overall = calculateOverallMatchScore(
      researchAlignment,
      funding,
      accessibility
    );

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

  return { results, total };
}
