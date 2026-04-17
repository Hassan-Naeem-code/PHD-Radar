import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { generateSecret, otpauthUrl, qrCodeImageUrl } from "@/lib/totp";

export async function POST() {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!dbUser) throw new ValidationError("User not found");
    if (dbUser.twoFactorEnabled) {
      throw new ValidationError("2FA already enabled");
    }

    const secret = generateSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, twoFactorEnabled: false },
    });

    const otpauth = otpauthUrl(secret, dbUser.email);
    return apiResponse({
      secret,
      otpauth,
      qrCodeUrl: qrCodeImageUrl(otpauth),
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("2FA setup failed"));
  }
}
