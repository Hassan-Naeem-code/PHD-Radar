import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const STATUSES = [
  "NOT_CONTACTED", "EMAIL_DRAFTED", "EMAIL_SENT", "FOLLOW_UP_SENT",
  "RESPONDED_POSITIVE", "RESPONDED_NEUTRAL", "RESPONDED_NEGATIVE",
  "MEETING_SCHEDULED", "MEETING_COMPLETED", "RELATIONSHIP_ACTIVE",
] as const;

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "TOP"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  notes: z.string().max(2000).optional(),
  researchFitScore: z.number().min(0).max(100).optional(),
  researchFitNotes: z.string().max(2000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ professorId: string }> }
) {
  try {
    const user = await requireAuth();
    const { professorId } = await params;

    const saved = await prisma.savedProfessor.findUnique({
      where: { userId_professorId: { userId: user.id, professorId } },
      include: {
        professor: {
          include: { university: true },
        },
      },
    });

    return apiResponse(saved);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ professorId: string }> }
) {
  try {
    const user = await requireAuth();
    const { professorId } = await params;
    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.savedProfessor.findUnique({
      where: { userId_professorId: { userId: user.id, professorId } },
    });
    if (!existing) throw new NotFoundError("Saved professor");

    const updated = await prisma.savedProfessor.update({
      where: { userId_professorId: { userId: user.id, professorId } },
      data,
    });

    await auditLog(user.id, "SAVED_PROFESSOR_UPDATED", { professorId });
    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Update failed"));
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ professorId: string }> }
) {
  try {
    const user = await requireAuth();
    const { professorId } = await params;

    await prisma.savedProfessor
      .delete({ where: { userId_professorId: { userId: user.id, professorId } } })
      .catch(() => null);

    await auditLog(user.id, "PROFESSOR_UNSAVED", { professorId });
    return apiResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Delete failed"));
  }
}
