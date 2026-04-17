import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";
import { reindexAllProfessors, isSemanticConfigured } from "@/services/search/semantic";

export async function POST() {
  try {
    const user = await requireAdmin();

    if (!isSemanticConfigured()) {
      throw new ValidationError(
        "Semantic index is not configured (needs OPENAI_API_KEY + PINECONE_API_KEY)"
      );
    }

    const result = await reindexAllProfessors();
    await auditLog(user.id, "SEMANTIC_REINDEX", { indexed: result.indexed });
    return apiResponse(result);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Reindex failed"));
  }
}
