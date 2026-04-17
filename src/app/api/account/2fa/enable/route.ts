import { NextRequest } from "next/server";
import { z } from "zod";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
} from "@/lib/totp";

const bodySchema = z.object({
  token: z.string().regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { token } = bodySchema.parse(await req.json());

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { totpSecret: true, twoFactorEnabled: true },
    });
    if (!dbUser?.totpSecret) {
      throw new ValidationError("Run /2fa/setup first");
    }
    if (dbUser.twoFactorEnabled) {
      throw new ValidationError("2FA already enabled");
    }

    if (!verifyTotp(dbUser.totpSecret, token)) {
      throw new ValidationError("Invalid code");
    }

    const plainBackupCodes = generateBackupCodes(8);
    const hashedBackupCodes = plainBackupCodes.map(hashBackupCode);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashedBackupCodes,
      },
    });

    await auditLog(user.id, "2FA_ENABLED");
    return apiResponse({ enabled: true, backupCodes: plainBackupCodes });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("2FA enable failed"));
  }
}
