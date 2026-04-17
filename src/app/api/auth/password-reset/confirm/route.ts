import { NextRequest } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";

const bodySchema = z.object({
  token: z.string().min(10),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = bodySchema.parse(body);
    const tokenHash = hashToken(token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record) throw new ValidationError("Invalid or expired reset link");
    if (record.usedAt) throw new ValidationError("This reset link has already been used");
    if (record.expires < new Date()) throw new ValidationError("This reset link has expired");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: record.userId,
          usedAt: null,
          NOT: { tokenHash },
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: record.userId,
          action: "PASSWORD_RESET",
        },
      }),
    ]);

    return apiResponse({ success: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Reset failed"));
  }
}
