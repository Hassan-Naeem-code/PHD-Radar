import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const savedOnly = url.searchParams.get("savedOnly") !== "false";
    const professorId = url.searchParams.get("professorId") ?? undefined;
    const limit = Math.min(200, parseInt(url.searchParams.get("limit") || "50"));

    let professorIds: string[] | undefined;
    if (savedOnly && !professorId) {
      const saved = await prisma.savedProfessor.findMany({
        where: { userId: user.id },
        select: { professorId: true },
      });
      professorIds = saved.map((s) => s.professorId);
      if (professorIds.length === 0) {
        return apiResponse([]);
      }
    }

    const publications = await prisma.publication.findMany({
      where: {
        ...(professorId ? { professorId } : {}),
        ...(professorIds ? { professorId: { in: professorIds } } : {}),
      },
      orderBy: [{ year: "desc" }, { citationCount: "desc" }],
      take: limit,
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            university: { select: { shortName: true, name: true } },
          },
        },
      },
    });

    return apiResponse(publications);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
