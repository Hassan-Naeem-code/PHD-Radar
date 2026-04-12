import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function DELETE() {
  try {
    const user = await requireAuth();

    await auditLog(user.id, "ACCOUNT_DELETION_REQUESTED");

    // Delete in order to respect foreign key constraints
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.deleteMany({ where: { userId: user.id } }),
      prisma.outreachEmail.deleteMany({ where: { userId: user.id } }),
      prisma.savedProfessor.deleteMany({ where: { userId: user.id } }),
      prisma.application.deleteMany({ where: { userId: user.id } }),
      prisma.search.deleteMany({ where: { userId: user.id } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.account.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);

    return apiResponse({ deleted: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Account deletion failed"));
  }
}
