import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError } from "@/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        university: true,
        publications: {
          orderBy: { year: "desc" },
          take: 10,
        },
        fundingSources: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    if (!professor) {
      throw new NotFoundError("Professor");
    }

    return apiResponse(professor);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
