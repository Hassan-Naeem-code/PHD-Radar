import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

const patchSchema = z.object({
  emailDigest: z.boolean().optional(),
  emailReminders: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const prefs = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailDigest: true, emailReminders: true, emailAlerts: true },
    });
    return apiResponse(prefs);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Failed to load preferences"));
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = patchSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { emailDigest: true, emailReminders: true, emailAlerts: true },
    });

    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Failed to update preferences"));
  }
}
