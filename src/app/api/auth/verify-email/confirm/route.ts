import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";

const bodySchema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = bodySchema.parse(body);
    const tokenHash = hashToken(token);

    const record = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record || record.identifier !== email) {
      throw new ValidationError("Invalid verification link");
    }
    if (record.expires < new Date()) {
      throw new ValidationError("Verification link expired");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token: tokenHash } }),
    ]);

    return apiResponse({ verified: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Verification failed"));
  }
}
