import { NextRequest } from "next/server";
import { z } from "zod";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";
import { enrichProfessor } from "@/services/scraper/enrichProfessor";

const SOURCES = [
  "openAlex", "arxiv", "crossref", "googleScholar",
  "csRankings", "github", "linkedin", "medium",
  "dblp", "orcid", "facultyPage", "nsf", "nih",
] as const;

const bodySchema = z.object({
  sources: z.array(z.enum(SOURCES)).optional(),
  force: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { sources, force } = bodySchema.parse(body);

    const report = await enrichProfessor(id, { sources, force });

    await auditLog(user.id, "PROFESSOR_ENRICHED", {
      professorId: id,
      sourcesUsed: report.sourcesUsed,
      publicationsAdded: report.publicationsAdded,
    });

    return apiResponse(report);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Enrichment failed"));
  }
}
