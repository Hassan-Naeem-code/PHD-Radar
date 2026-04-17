import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ExternalAPIError } from "./errors";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "user-uploads";

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
  storage: "supabase" | "local";
}

export interface UploadOptions {
  userId: string;
  folder: string;
  file: File;
  bucket?: string;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function objectPath(userId: string, folder: string, fileName: string): string {
  const ts = Date.now();
  const safe = sanitizeFileName(fileName);
  return `${userId}/${folder}/${ts}-${safe}`;
}

export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
  const { userId, folder, file } = opts;
  const bucket = opts.bucket ?? DEFAULT_BUCKET;
  const path = objectPath(userId, folder, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isSupabaseConfigured()) {
    return uploadToSupabase({
      bucket,
      path,
      buffer,
      contentType: file.type,
    });
  }

  return uploadToLocal({ path, buffer, contentType: file.type });
}

async function uploadToSupabase(args: {
  bucket: string;
  path: string;
  buffer: Buffer;
  contentType: string;
}): Promise<UploadResult> {
  const url = `${SUPABASE_URL}/storage/v1/object/${args.bucket}/${args.path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": args.contentType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: new Uint8Array(args.buffer),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ExternalAPIError(
      "Supabase Storage",
      new Error(`${res.status} ${text}`)
    );
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${args.bucket}/${args.path}`;

  return {
    url: publicUrl,
    path: args.path,
    size: args.buffer.length,
    contentType: args.contentType,
    storage: "supabase",
  };
}

async function uploadToLocal(args: {
  path: string;
  buffer: Buffer;
  contentType: string;
}): Promise<UploadResult> {
  const uploadRoot = join(process.cwd(), "public", "uploads");
  const destDir = join(uploadRoot, args.path.split("/").slice(0, -1).join("/"));
  await mkdir(destDir, { recursive: true });
  const dest = join(uploadRoot, args.path);
  await writeFile(dest, new Uint8Array(args.buffer));

  return {
    url: `/uploads/${args.path}`,
    path: args.path,
    size: args.buffer.length,
    contentType: args.contentType,
    storage: "local",
  };
}

export async function deleteFile(
  path: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
}
