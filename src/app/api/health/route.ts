import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/errors";

export async function GET() {
  let dbStatus = "disconnected";
  let redisStatus = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  try {
    const { getRedis } = await import("@/lib/redis");
    const redis = getRedis();
    await redis.ping();
    redisStatus = "connected";
  } catch {
    redisStatus = "unavailable";
  }

  return apiResponse({
    status: dbStatus === "connected" ? "ok" : "degraded",
    db: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
}
