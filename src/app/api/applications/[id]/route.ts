import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const APPLICATION_STATUSES = [
  "RESEARCHING", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW",
  "ADMITTED_FUNDED", "ADMITTED_UNFUNDED", "WAITLISTED",
  "REJECTED", "WITHDRAWN", "ACCEPTED_OFFER",
] as const;

const patchSchema = z.object({
  universityName: z.string().min(1).optional(),
  program: z.string().min(1).optional(),
  term: z.string().min(1).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  deadline: z.string().nullable().optional(),
  portalUrl: z.string().url().or(z.literal("")).optional(),
  notes: z.string().max(2000).optional(),
  sopUploaded: z.boolean().optional(),
  cvUploaded: z.boolean().optional(),
  transcriptsUploaded: z.boolean().optional(),
  recsRequested: z.number().min(0).max(10).optional(),
  recsReceived: z.number().min(0).max(10).optional(),
  toeflSent: z.boolean().optional(),
  submittedAt: z.string().nullable().optional(),
  decisionDate: z.string().nullable().optional(),
  fundingOffered: z.boolean().nullable().optional(),
  fundingAmount: z.number().nullable().optional(),
});

async function assertOwner(id: string, userId: string) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw new NotFoundError("Application");
  if (app.userId !== userId) throw new ForbiddenError();
  return app;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const app = await assertOwner(id, user.id);
    return apiResponse(app);
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

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline === undefined ? undefined : data.deadline ? new Date(data.deadline) : null,
        submittedAt: data.submittedAt === undefined ? undefined : data.submittedAt ? new Date(data.submittedAt) : null,
        decisionDate: data.decisionDate === undefined ? undefined : data.decisionDate ? new Date(data.decisionDate) : null,
        portalUrl: data.portalUrl === "" ? null : data.portalUrl,
      },
    });

    await auditLog(user.id, "APPLICATION_UPDATED", { applicationId: id });

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

    await prisma.application.delete({ where: { id } });
    await auditLog(user.id, "APPLICATION_DELETED", { applicationId: id });

    return apiResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Delete failed"));
  }
}
