import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";
import { sendVerifyEmail } from "@/lib/email";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function sendVerificationTo(
  email: string,
  name: string,
  origin: string
): Promise<{ sent: boolean; url?: string }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });
  await prisma.verificationToken.create({
    data: { identifier: email, token: tokenHash, expires },
  });

  const verifyUrl = `${origin}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const { logger } = await import("@/lib/logger");
  const log = logger.child({ module: "verify-email" });

  if (process.env.RESEND_API_KEY) {
    sendVerifyEmail(email, name, verifyUrl).catch((err) => {
      log.error("verify email failed", { err });
    });
  } else if (process.env.NODE_ENV !== "production") {
    log.info("verify URL generated (dev)", { verifyUrl });
  }

  return { sent: true, url: process.env.NODE_ENV !== "production" ? verifyUrl : undefined };
}

export { sendVerificationTo };

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true, emailVerified: true },
    });
    if (!dbUser) throw new ValidationError("User not found");
    if (dbUser.emailVerified) throw new ValidationError("Email already verified");

    const origin =
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";

    const result = await sendVerificationTo(dbUser.email, dbUser.name, origin);
    return apiResponse(result);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Verification email failed"));
  }
}
