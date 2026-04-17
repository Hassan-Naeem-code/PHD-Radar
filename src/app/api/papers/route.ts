import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, paginatedResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const savedOnly = url.searchParams.get("savedOnly") !== "false";
    const professorId = url.searchParams.get("professorId") ?? undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")));

    let professorIds: string[] | undefined;
    if (savedOnly && !professorId) {
      const saved = await prisma.savedProfessor.findMany({
        where: { userId: user.id },
        select: { professorId: true },
      });
      professorIds = saved.map((s) => s.professorId);
      if (professorIds.length === 0) {
        return paginatedResponse([], page, pageSize, 0);
      }
    }

    const where = {
      ...(professorId ? { professorId } : {}),
      ...(professorIds ? { professorId: { in: professorIds } } : {}),
    };

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        orderBy: [{ year: "desc" }, { citationCount: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              university: { select: { shortName: true, name: true } },
            },
          },
        },
      }),
      prisma.publication.count({ where }),
    ]);

    return paginatedResponse(publications, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
