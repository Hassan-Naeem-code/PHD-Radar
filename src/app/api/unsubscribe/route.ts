import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";

/**
 * One-click unsubscribe endpoint for List-Unsubscribe-Post header (RFC 8058).
 * Token is HMAC-SHA256(userId, NEXTAUTH_SECRET) — no DB lookup needed to verify.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("uid");
    const type = url.searchParams.get("type");
    const token = url.searchParams.get("token");

    if (!userId || !type || !token) {
      return apiError(new Error("Missing parameters"));
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return apiError(new Error("Server misconfigured"));

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${userId}:${type}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(token, "hex"),
        Buffer.from(expected, "hex")
      )
    ) {
      return apiError(new Error("Invalid token"));
    }

    const field =
      type === "digest"
        ? "emailDigest"
        : type === "reminders"
          ? "emailReminders"
          : type === "alerts"
            ? "emailAlerts"
            : null;

    if (!field) return apiError(new Error("Invalid type"));

    await prisma.user.update({
      where: { id: userId },
      data: { [field]: false },
    });

    return apiResponse({ unsubscribed: true, type });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Unsubscribe failed"));
  }
}
