import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { applicationSchema } from "@/utils/validation";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;

    const apps = await prisma.application.findMany({
      where: { userId },
      orderBy: { deadline: "asc" },
    });

    return apiResponse(apps);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = applicationSchema.parse(body);

    const app = await prisma.application.create({
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId: user.id,
      },
    });

    return apiResponse(app);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
