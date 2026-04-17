import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";

const patchSchema = z.object({
  role: z.enum(["STUDENT", "ADMIN"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { role } = patchSchema.parse(body);

    if (caller.id === id && role !== "ADMIN") {
      throw new ForbiddenError();
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) throw new NotFoundError("User");

    if (target.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) throw new ForbiddenError();
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, name: true },
    });

    await auditLog(caller.id, "USER_ROLE_CHANGED", {
      targetUserId: id,
      targetEmail: target.email,
      newRole: role,
    });

    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Role change failed"));
  }
}
