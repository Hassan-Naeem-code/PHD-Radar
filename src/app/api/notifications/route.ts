import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id, ...(unreadOnly ? { read: false } : {}) },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return apiResponse({ items, unreadCount });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
  read: z.boolean().default(true),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { ids, all, read } = patchSchema.parse(await req.json());

    if (all) {
      await prisma.notification.updateMany({
        where: { userId: user.id },
        data: { read },
      });
    } else if (ids && ids.length) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId: user.id },
        data: { read },
      });
    }

    return apiResponse({ updated: true });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Update failed"));
  }
}
