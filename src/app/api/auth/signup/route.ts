import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError, RateLimitError } from "@/lib/errors";
import { signupSchema } from "@/utils/validation";
import { auditLog } from "@/lib/api-auth";
import { sendWelcomeEmail } from "@/lib/email";
import { sendVerificationTo } from "@/app/api/auth/verify-email/send/route";
import { getAuthLimiter, checkRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    try {
      const ip = getClientIp(req);
      const { success } = await checkRateLimit(getAuthLimiter(), `signup:${ip}`);
      if (!success) throw new RateLimitError();
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ValidationError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
    });

    await auditLog(user.id, "USER_SIGNED_UP", { email: data.email });

    const { logger } = await import("@/lib/logger");
    const log = logger.child({ module: "signup", userId: user.id });

    if (process.env.RESEND_API_KEY) {
      sendWelcomeEmail(user.email, user.name).catch((err) => {
        log.error("welcome email failed", { err });
      });
    }

    const origin =
      req.headers.get("origin") ??
      process.env.NEXTAUTH_URL ??
      "http://localhost:3000";
    sendVerificationTo(user.email, user.name, origin).catch((err) => {
      log.error("verification email failed", { err });
    });

    log.info("user signed up");

    return apiResponse({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
