import { prisma } from "@/lib/prisma";
import { searchNSFAwards } from "./nsfAwards";
import { searchNIHGrants } from "./nihReporter";
import { searchPapers } from "./semanticScholar";
import { loadCSRankings } from "./csRankings";
import { enrichProfessorsByAffiliation } from "./enrichProfessor";

export type ScrapeSource =
  | "nsf_awards"
  | "nih_reporter"
  | "semantic_scholar"
  | "cs_rankings"
  | "enrich_by_affiliation";

export const SCRAPE_SOURCES: ScrapeSource[] = [
  "nsf_awards",
  "nih_reporter",
  "semantic_scholar",
  "cs_rankings",
  "enrich_by_affiliation",
];

const DEFAULT_KEYWORDS = [
  "machine learning",
  "artificial intelligence",
  "natural language processing",
  "computer vision",
  "robotics",
];

interface RunResult {
  jobId: string;
  source: ScrapeSource;
  resultCount: number;
  status: "COMPLETED" | "FAILED";
  errorMessage?: string;
}

export async function runScrapingJob(
  source: ScrapeSource,
  options: { keyword?: string; affiliation?: string } = {}
): Promise<RunResult> {
  const keyword = options.keyword ?? DEFAULT_KEYWORDS[0];

  const job = await prisma.scrapingJob.create({
    data: {
      source,
      status: "RUNNING",
      targetUrl: options.affiliation ?? keyword,
      startedAt: new Date(),
    },
  });

  try {
    let resultCount = 0;
    if (source === "nsf_awards") {
      resultCount = (await searchNSFAwards(keyword, 50)).length;
    } else if (source === "nih_reporter") {
      resultCount = (await searchNIHGrants(keyword, 50)).length;
    } else if (source === "semantic_scholar") {
      resultCount = (await searchPapers(keyword, 25)).length;
    } else if (source === "cs_rankings") {
      const authors = await loadCSRankings();
      resultCount = authors.length;
    } else if (source === "enrich_by_affiliation") {
      const affiliation = options.affiliation ?? "Massachusetts Institute of Technology";
      const reports = await enrichProfessorsByAffiliation(affiliation, 10);
      resultCount = reports.reduce((acc, r) => acc + (r.sourcesUsed.length > 0 ? 1 : 0), 0);
    }

    const updated = await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        resultCount,
        completedAt: new Date(),
      },
    });

    return {
      jobId: updated.id,
      source,
      resultCount,
      status: "COMPLETED",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      source,
      resultCount: 0,
      status: "FAILED",
      errorMessage: message,
    };
  }
}
