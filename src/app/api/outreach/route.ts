import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { outreachEmailSchema } from "@/utils/validation";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const emails = await prisma.outreachEmail.findMany({
      where: { userId },
      include: { professor: { select: { name: true, university: { select: { shortName: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(emails);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = outreachEmailSchema.parse(body);

    const email = await prisma.outreachEmail.create({
      data: {
        subject: data.subject,
        body: data.body,
        type: data.type,
        userId: user.id,
        professorId: data.professorId,
      },
    });

    await auditLog(user.id, "EMAIL_DRAFTED", { professorId: data.professorId });

    return apiResponse(email);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
