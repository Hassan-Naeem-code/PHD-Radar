import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError, RateLimitError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";
import { getSearchLimiter, checkRateLimit } from "@/lib/rate-limit";
import {
  semanticSearchProfessors,
  isSemanticConfigured,
} from "@/services/search/semantic";

const bodySchema = z.object({
  query: z.string().min(2).max(500),
  topK: z.number().min(1).max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { success } = await checkRateLimit(getSearchLimiter(), user.id);
    if (!success) throw new RateLimitError();

    if (!isSemanticConfigured()) {
      throw new ValidationError(
        "Semantic search is not configured (needs OPENAI_API_KEY + PINECONE_API_KEY)"
      );
    }

    const body = await req.json();
    const { query, topK = 20 } = bodySchema.parse(body);

    const hits = await semanticSearchProfessors(query, topK);
    if (hits.length === 0) return apiResponse({ results: [], total: 0 });

    const ids = hits.map((h) => h.id);
    const profs = await prisma.professor.findMany({
      where: { id: { in: ids } },
      include: {
        university: { select: { name: true, shortName: true } },
      },
    });

    const byId = new Map(profs.map((p) => [p.id, p]));
    const results = hits
      .map((hit) => {
        const prof = byId.get(hit.id);
        if (!prof) return null;
        return {
          id: prof.id,
          name: prof.name,
          title: prof.title,
          department: prof.department,
          universityName: prof.university.name,
          universityShortName: prof.university.shortName,
          researchAreas: prof.researchAreas,
          hIndex: prof.hIndex,
          citations: prof.citations,
          hasActiveFunding: prof.hasActiveFunding,
          lookingForStudents: prof.lookingForStudents,
          fundingScore: prof.fundingScore,
          semanticScore: hit.score,
        };
      })
      .filter(<T,>(v: T | null): v is T => v !== null);

    await prisma.search
      .create({
        data: {
          userId: user.id,
          query,
          filters: { semantic: true } as never,
          resultCount: results.length,
        },
      })
      .catch(() => {});

    return apiResponse({ results, total: results.length });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Semantic search failed"));
  }
}
