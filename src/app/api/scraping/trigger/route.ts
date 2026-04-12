import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const url = new URL(req.url);
    const source = url.searchParams.get("source") || "scholar";

    const job = await prisma.scrapingJob.create({
      data: {
        source,
        status: "PENDING",
      },
    });

    // In production, this would trigger an Inngest/BullMQ job
    // For now, just create the job record

    await auditLog(user.id, "SCRAPING_TRIGGERED", { source, jobId: job.id });

    return apiResponse({ jobId: job.id, status: "PENDING" });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
