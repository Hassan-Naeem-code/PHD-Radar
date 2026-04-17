import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";

/**
 * Data retention cleanup — meant to run as a daily cron.
 * - Search logs older than 90 days: deleted
 * - Read notifications older than 90 days: deleted
 * - Audit logs older than 1 year: deleted (per privacy policy)
 * - Expired password reset tokens: deleted
 * - Expired verification tokens: deleted
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
        { status: 401 }
      );
    }

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const [searches, notifications, auditLogs, resetTokens, verifyTokens] =
      await prisma.$transaction([
        prisma.search.deleteMany({
          where: { createdAt: { lt: ninetyDaysAgo } },
        }),
        prisma.notification.deleteMany({
          where: { read: true, createdAt: { lt: ninetyDaysAgo } },
        }),
        prisma.auditLog.deleteMany({
          where: { createdAt: { lt: oneYearAgo } },
        }),
        prisma.passwordResetToken.deleteMany({
          where: { expires: { lt: now } },
        }),
        prisma.verificationToken.deleteMany({
          where: { expires: { lt: now } },
        }),
      ]);

    return apiResponse({
      deleted: {
        searches: searches.count,
        notifications: notifications.count,
        auditLogs: auditLogs.count,
        resetTokens: resetTokens.count,
        verifyTokens: verifyTokens.count,
      },
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Cleanup failed"));
  }
}
