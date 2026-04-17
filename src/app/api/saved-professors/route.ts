import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError, paginatedResponse } from "@/lib/errors";
import { savedProfessorSchema } from "@/utils/validation";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const priority = url.searchParams.get("priority") ?? undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")));

    const where = {
      userId: user.id,
      ...(status ? { status: status as never } : {}),
      ...(priority ? { priority: priority as never } : {}),
    };

    const [saved, total] = await Promise.all([
      prisma.savedProfessor.findMany({
        where,
        include: {
          professor: {
            include: { university: { select: { name: true, shortName: true } } },
          },
        },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.savedProfessor.count({ where }),
    ]);

    return paginatedResponse(saved, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = savedProfessorSchema.parse(body);

    const exists = await prisma.professor.findUnique({
      where: { id: data.professorId },
      select: { id: true },
    });
    if (!exists) throw new ValidationError("Professor not found");

    const record = await prisma.savedProfessor.upsert({
      where: {
        userId_professorId: { userId: user.id, professorId: data.professorId },
      },
      update: {
        notes: data.notes,
        priority: data.priority,
      },
      create: {
        userId: user.id,
        professorId: data.professorId,
        notes: data.notes,
        priority: data.priority ?? "MEDIUM",
      },
    });

    await auditLog(user.id, "PROFESSOR_SAVED", { professorId: data.professorId });

    return apiResponse(record);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Save failed"));
  }
}
