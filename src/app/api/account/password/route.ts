import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = passwordSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!dbUser?.passwordHash) {
      throw new ValidationError("Password change not available for SSO accounts");
    }

    const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
    if (!valid) throw new ValidationError("Current password is incorrect");

    const newHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await auditLog(user.id, "PASSWORD_CHANGED");
    return apiResponse({ updated: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Password change failed"));
  }
}
