import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");

    if (jobId) {
      const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } });
      return apiResponse(job);
    }

    const recentJobs = await prisma.scrapingJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return apiResponse(recentJobs);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
