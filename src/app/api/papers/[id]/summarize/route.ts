import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { getAiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { summarizePaper } from "@/services/ai/paperSummarizer";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { success } = await checkRateLimit(getAiLimiter(), user.id);
    if (!success) throw new RateLimitError();

    const { id } = await params;
    const paper = await prisma.publication.findUnique({ where: { id } });
    if (!paper) throw new NotFoundError("Paper");
    if (!paper.abstract) throw new ValidationError("Paper has no abstract to summarize");

    const summary = await summarizePaper({
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
    });

    const updated = await prisma.publication.update({
      where: { id },
      data: {
        summary: summary.summary,
        keyFindings: summary.keyFindings,
        futureWork: summary.futureWork,
      },
    });

    await auditLog(user.id, "PAPER_SUMMARIZED", { paperId: id });
    return apiResponse({
      id: updated.id,
      summary: updated.summary,
      keyFindings: updated.keyFindings,
      futureWork: updated.futureWork,
      techniques: summary.techniques,
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Summarize failed"));
  }
}
