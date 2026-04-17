import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { sendPasswordResetEmail } from "@/lib/email";
import { getApiLimiter, checkRateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email(),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getClientId(req: NextRequest, email: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return `reset:${email}:${ip}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = bodySchema.parse(body);

    try {
      const { success } = await checkRateLimit(getApiLimiter(), getClientId(req, email));
      if (!success) {
        return apiResponse({ sent: true });
      }
    } catch {
      // Redis unavailable — skip rate limit in dev
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return apiResponse({ sent: true });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expires },
    });

    const origin =
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    const { logger } = await import("@/lib/logger");
    const log = logger.child({ module: "password-reset", userId: user.id });

    if (process.env.RESEND_API_KEY) {
      sendPasswordResetEmail(user.email, user.name, resetUrl).catch((err) => {
        log.error("reset email failed", { err });
      });
    } else if (process.env.NODE_ENV !== "production") {
      log.info("reset URL generated (dev)", { resetUrl });
    }

    return apiResponse({ sent: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Reset request failed"));
  }
}
