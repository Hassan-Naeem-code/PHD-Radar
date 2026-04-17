import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";
import {
  predictFundingRuleBased,
  predictFundingWithAI,
} from "@/services/ai/fundingPredictor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const url = new URL(req.url);
    const ai = url.searchParams.get("ai") === "true";

    const prof = await prisma.professor.findUnique({
      where: { id },
      include: { fundingSources: true },
    });
    if (!prof) throw new NotFoundError("Professor");

    const grants = prof.fundingSources.map((g) => ({
      title: g.title,
      agency: g.agency,
      amount: g.amount,
      startDate: g.startDate,
      endDate: g.endDate,
      status: g.status,
    }));

    const forecast = ai
      ? await predictFundingWithAI(grants, prof.name)
      : predictFundingRuleBased(grants);

    return apiResponse(forecast);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Forecast failed"));
  }
}
