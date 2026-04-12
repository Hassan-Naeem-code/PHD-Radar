import { NextRequest } from "next/server";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = {
  cv: 5 * 1024 * 1024,        // 5MB
  transcript: 10 * 1024 * 1024, // 10MB
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "cv" or "transcript"

    if (!file) throw new ValidationError("No file provided");
    if (!type || !["cv", "transcript"].includes(type)) {
      throw new ValidationError("Invalid file type. Must be 'cv' or 'transcript'");
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError("Only PDF and DOCX files are accepted");
    }

    const maxSize = MAX_SIZE[type as keyof typeof MAX_SIZE];
    if (file.size > maxSize) {
      throw new ValidationError(
        `File too large. Maximum size for ${type} is ${maxSize / (1024 * 1024)}MB`
      );
    }

    // In production: Upload to Supabase Storage with signed URL
    // For now, return a mock URL
    const mockUrl = `https://storage.phdradar.com/users/${user.id}/${type}/${file.name}`;

    await auditLog(user.id, "FILE_UPLOADED", { type, fileName: file.name, fileSize: file.size });

    return apiResponse({
      url: mockUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Upload failed"));
  }
}
