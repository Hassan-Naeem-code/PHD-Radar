import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { verifyTotp } from "@/lib/totp";

const bodySchema = z.object({
  password: z.string().min(1),
  token: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { password, token } = bodySchema.parse(await req.json());

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, totpSecret: true, twoFactorEnabled: true },
    });
    if (!dbUser?.twoFactorEnabled || !dbUser.totpSecret) {
      throw new ValidationError("2FA is not enabled");
    }
    if (!dbUser.passwordHash) {
      throw new ValidationError("No password set — use SSO to authenticate first");
    }
    if (!(await bcrypt.compare(password, dbUser.passwordHash))) {
      throw new ValidationError("Incorrect password");
    }
    if (!verifyTotp(dbUser.totpSecret, token)) {
      throw new ValidationError("Invalid code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        totpSecret: null,
        backupCodes: [],
      },
    });

    await auditLog(user.id, "2FA_DISABLED");
    return apiResponse({ disabled: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("2FA disable failed"));
  }
}
