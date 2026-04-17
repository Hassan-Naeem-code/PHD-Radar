import { NextRequest } from "next/server";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { uploadFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = {
  cv: 5 * 1024 * 1024,
  transcript: 10 * 1024 * 1024,
  avatar: 2 * 1024 * 1024,
} as const;

const USER_FIELD_BY_TYPE: Record<string, "cvUrl" | "transcriptUrl" | "avatar"> = {
  cv: "cvUrl",
  transcript: "transcriptUrl",
  avatar: "avatar",
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) throw new ValidationError("No file provided");
    if (!type || !(type in MAX_SIZE)) {
      throw new ValidationError("Invalid type. Must be 'cv', 'transcript', or 'avatar'");
    }

    const isAvatar = type === "avatar";
    if (isAvatar) {
      if (!file.type.startsWith("image/")) {
        throw new ValidationError("Avatar must be an image");
      }
    } else if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Only PDF and DOCX files are accepted");
    }

    const maxSize = MAX_SIZE[type as keyof typeof MAX_SIZE];
    if (file.size > maxSize) {
      throw new ValidationError(
        `File too large. Max for ${type} is ${maxSize / (1024 * 1024)}MB`
      );
    }

    const result = await uploadFile({
      userId: user.id,
      folder: type,
      file,
    });

    const field = USER_FIELD_BY_TYPE[type];
    if (field) {
      await prisma.user.update({
        where: { id: user.id },
        data: { [field]: result.url },
      });
    }

    await auditLog(user.id, "FILE_UPLOADED", {
      type,
      fileName: file.name,
      fileSize: file.size,
      storage: result.storage,
    });

    return apiResponse({
      url: result.url,
      path: result.path,
      fileName: file.name,
      fileSize: result.size,
      fileType: result.contentType,
      storage: result.storage,
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Upload failed"));
  }
}
