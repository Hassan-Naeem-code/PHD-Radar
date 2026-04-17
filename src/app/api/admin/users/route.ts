import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, paginatedResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const query = url.searchParams.get("query")?.trim() ?? "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "25"))
    );

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          createdAt: true,
          _count: {
            select: { searches: true, savedProfessors: true, applications: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        plan: u.plan,
        createdAt: u.createdAt,
        searches: u._count.searches,
        savedProfessors: u._count.savedProfessors,
        applications: u._count.applications,
      })),
      page,
      pageSize,
      total
    );
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
