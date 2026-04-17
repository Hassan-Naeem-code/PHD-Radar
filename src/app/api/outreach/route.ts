import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, paginatedResponse } from "@/lib/errors";
import { outreachEmailSchema } from "@/utils/validation";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "50")));

    const where = { userId };

    const [emails, total] = await Promise.all([
      prisma.outreachEmail.findMany({
        where,
        include: { professor: { select: { name: true, university: { select: { shortName: true } } } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.outreachEmail.count({ where }),
    ]);

    return paginatedResponse(emails, page, pageSize, total);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = outreachEmailSchema.parse(body);

    const email = await prisma.outreachEmail.create({
      data: {
        subject: data.subject,
        body: data.body,
        type: data.type,
        userId: user.id,
        professorId: data.professorId,
      },
    });

    await auditLog(user.id, "EMAIL_DRAFTED", { professorId: data.professorId });

    return apiResponse(email);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
