import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const patchSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(10).max(5000).optional(),
  responseReceived: z.boolean().optional(),
  responseSummary: z.string().max(2000).optional(),
  responseDate: z.string().nullable().optional(),
});

async function assertOwner(id: string, userId: string) {
  const email = await prisma.outreachEmail.findUnique({ where: { id } });
  if (!email) throw new NotFoundError("Email");
  if (email.userId !== userId) throw new ForbiddenError();
  return email;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const email = await prisma.outreachEmail.findUnique({
      where: { id },
      include: {
        professor: {
          include: { university: { select: { name: true, shortName: true } } },
        },
      },
    });
    if (!email) throw new NotFoundError("Email");
    if (email.userId !== user.id) throw new ForbiddenError();
    return apiResponse(email);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await assertOwner(id, user.id);

    const body = await req.json();
    const data = patchSchema.parse(body);

    const updated = await prisma.outreachEmail.update({
      where: { id },
      data: {
        ...data,
        responseDate: data.responseDate === undefined
          ? undefined
          : data.responseDate ? new Date(data.responseDate) : null,
      },
    });

    await auditLog(user.id, "EMAIL_UPDATED", { emailId: id });
    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Update failed"));
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await assertOwner(id, user.id);

    await prisma.outreachEmail.delete({ where: { id } });
    await auditLog(user.id, "EMAIL_DELETED", { emailId: id });

    return apiResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Delete failed"));
  }
}
