import { NextRequest } from "next/server";
import { z } from "zod";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";
import { runScrapingJob, SCRAPE_SOURCES, type ScrapeSource } from "@/services/scraper/runner";

const bodySchema = z.object({
  source: z.enum(SCRAPE_SOURCES as [ScrapeSource, ...ScrapeSource[]]).optional(),
  keyword: z.string().min(2).max(100).optional(),
  affiliation: z.string().min(2).max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { source = "semantic_scholar", keyword, affiliation } = bodySchema.parse(body);

    const result = await runScrapingJob(source, { keyword, affiliation });

    await auditLog(user.id, "SCRAPING_TRIGGERED", {
      source,
      keyword,
      affiliation,
      jobId: result.jobId,
      status: result.status,
    });

    return apiResponse(result);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Scraping failed"));
  }
}
