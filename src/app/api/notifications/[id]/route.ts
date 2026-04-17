import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const note = await prisma.notification.findUnique({ where: { id } });
    if (!note) throw new NotFoundError("Notification");
    if (note.userId !== user.id) throw new ForbiddenError();

    await prisma.notification.delete({ where: { id } });
    return apiResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Delete failed"));
  }
}
