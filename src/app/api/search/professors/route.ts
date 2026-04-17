import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, paginatedResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";
import { getSearchLimiter, checkRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import {
  calculateResearchAlignmentScore,
  calculateFundingScore,
  calculateAccessibilityScore,
  calculateOverallMatchScore,
} from "@/utils/scoring";

interface ProfessorFilters {
  query?: string;
  fundingRequired?: boolean;
  lookingForStudents?: boolean;
  country?: string;
  researchArea?: string;
  universityName?: string;
  rankingMax?: number;
  minFundingScore?: number;
  page?: number;
  pageSize?: number;
}

async function runSearch(userId: string, filters: ProfessorFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));

  const where: Prisma.ProfessorWhereInput = {};
  const andClauses: Prisma.ProfessorWhereInput[] = [];

  if (filters.query) {
    const parts = filters.query.split(",").map((q) => q.trim()).filter(Boolean);
    andClauses.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        { researchSummary: { contains: filters.query, mode: "insensitive" } },
        ...(parts.length ? [{ researchAreas: { hasSome: parts } }] : []),
      ],
    });
  }

  if (filters.fundingRequired) {
    where.hasActiveFunding = true;
  }

  if (filters.lookingForStudents) {
    where.lookingForStudents = true;
  }

  if (filters.researchArea) {
    andClauses.push({
      researchAreas: { hasSome: [filters.researchArea] },
    });
  }

  if (filters.minFundingScore !== undefined) {
    where.fundingScore = { gte: filters.minFundingScore };
  }

  const universityFilter: Prisma.UniversityWhereInput = {};
  if (filters.country) universityFilter.country = filters.country;
  if (filters.universityName) {
    universityFilter.name = { contains: filters.universityName, mode: "insensitive" };
  }
  if (filters.rankingMax !== undefined) {
    universityFilter.csRanking = { lte: filters.rankingMax };
  }
  if (Object.keys(universityFilter).length > 0) {
    where.university = universityFilter;
  }

  if (andClauses.length) where.AND = andClauses;

  const [professors, total, savedIds] = await Promise.all([
    prisma.professor.findMany({
      where,
      include: {
        university: true,
        fundingSources: { where: { status: "Active" } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ fundingScore: "desc" }, { hIndex: "desc" }],
    }),
    prisma.professor.count({ where }),
    prisma.savedProfessor.findMany({
      where: { userId },
      select: { professorId: true },
    }),
  ]);

  const savedSet = new Set(savedIds.map((s) => s.professorId));
  const userInterests = filters.query
    ? filters.query.split(",").map((q) => q.trim()).filter(Boolean)
    : [];

  const results = professors.map((prof) => {
    const researchAlignment = calculateResearchAlignmentScore(userInterests, prof.researchAreas);
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
      universityShortName: prof.university.shortName,
      csRanking: prof.university.csRanking,
      researchAreas: prof.researchAreas,
      hIndex: prof.hIndex,
      citations: prof.citations,
      hasActiveFunding: prof.hasActiveFunding,
      lookingForStudents: prof.lookingForStudents,
      fundingScore: prof.fundingScore,
      researchAlignmentScore: researchAlignment,
      overallMatchScore: overall,
      saved: savedSet.has(prof.id),
    };
  });

  results.sort((a, b) => b.overallMatchScore - a.overallMatchScore);
  return { results, total, page, pageSize };
}

async function logSearch(userId: string, filters: ProfessorFilters, total: number) {
  if (!filters.query) return;
  await prisma.search
    .create({
      data: {
        userId,
        query: filters.query,
        filters: filters as Prisma.InputJsonValue,
        resultCount: total,
      },
    })
    .catch(() => {});
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { success } = await checkRateLimit(getSearchLimiter(), user.id);
    if (!success) throw new RateLimitError();

    const url = new URL(req.url);
    const filters: ProfessorFilters = {
      query: url.searchParams.get("query") ?? undefined,
      fundingRequired: url.searchParams.get("fundingRequired") === "true" || undefined,
      lookingForStudents: url.searchParams.get("lookingForStudents") === "true" || undefined,
      country: url.searchParams.get("country") ?? undefined,
      researchArea: url.searchParams.get("researchArea") ?? undefined,
      universityName: url.searchParams.get("universityName") ?? undefined,
      rankingMax: url.searchParams.get("rankingMax")
        ? parseInt(url.searchParams.get("rankingMax")!)
        : undefined,
      minFundingScore: url.searchParams.get("minFundingScore")
        ? parseInt(url.searchParams.get("minFundingScore")!)
        : undefined,
      page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : 1,
      pageSize: url.searchParams.get("pageSize") ? parseInt(url.searchParams.get("pageSize")!) : 20,
    };

    const { results, total, page, pageSize } = await runSearch(user.id, filters);
    await logSearch(user.id, filters, total);

    return paginatedResponse(results, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { success } = await checkRateLimit(getSearchLimiter(), user.id);
    if (!success) throw new RateLimitError();

    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      filters?: ProfessorFilters;
      page?: number;
      pageSize?: number;
    };

    const filters: ProfessorFilters = {
      ...(body.filters ?? {}),
      query: body.query ?? body.filters?.query,
      page: body.page ?? 1,
      pageSize: body.pageSize ?? 20,
    };

    const { results, total, page, pageSize } = await runSearch(user.id, filters);
    await logSearch(user.id, filters, total);

    return paginatedResponse(results, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
