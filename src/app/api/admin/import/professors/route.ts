import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAdmin, auditLog } from "@/lib/api-auth";
import { parseCSV } from "@/lib/csv";
import { logger } from "@/lib/logger";

const REQUIRED_HEADERS = ["name", "university"];
const MAX_ROWS = 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const log = logger.child({ module: "admin-import" });

function splitList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseOptNum(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseBool(raw: string): boolean | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (["true", "yes", "1", "y"].includes(v)) return true;
  if (["false", "no", "0", "n"].includes(v)) return false;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) throw new ValidationError("No file provided");
    if (file.size > MAX_FILE_BYTES) {
      throw new ValidationError(`File too large (max ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
    }

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    for (const h of REQUIRED_HEADERS) {
      if (!headers.includes(h)) {
        throw new ValidationError(`Missing required column: ${h}`);
      }
    }
    if (rows.length === 0) throw new ValidationError("CSV has no data rows");
    if (rows.length > MAX_ROWS) {
      throw new ValidationError(`Too many rows (max ${MAX_ROWS})`);
    }

    const results = {
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; reason: string }>,
    };

    for (const [index, row] of rows.entries()) {
      try {
        const name = row.name?.trim();
        const universityName = row.university?.trim();
        if (!name || !universityName) {
          results.skipped++;
          results.errors.push({ row: index + 2, reason: "missing name or university" });
          continue;
        }

        const university = await prisma.university.upsert({
          where: { name: universityName },
          update: {},
          create: {
            name: universityName,
            shortName: row.universityShortName || null,
            country: row.country || "US",
          },
        });

        const data = {
          name,
          email: row.email || null,
          title: row.title || null,
          department: row.department || null,
          researchAreas: splitList(row.researchAreas),
          researchSummary: row.researchSummary || null,
          personalWebsite: row.personalWebsite || null,
          googleScholarUrl: row.googleScholarUrl || null,
          githubUrl: row.githubUrl || null,
          linkedinUrl: row.linkedinUrl || null,
          labName: row.labName || null,
          labWebsite: row.labWebsite || null,
          hIndex: parseOptNum(row.hIndex),
          citations: parseOptNum(row.citations),
          hasActiveFunding: parseBool(row.hasActiveFunding) ?? false,
          lookingForStudents: parseBool(row.lookingForStudents) ?? false,
          dataQuality: "MEDIUM" as const,
        };

        const existing = await prisma.professor.findFirst({
          where: { name, universityId: university.id },
          select: { id: true },
        });

        if (existing) {
          await prisma.professor.update({ where: { id: existing.id }, data });
          results.updated++;
        } else {
          await prisma.professor.create({
            data: { ...data, universityId: university.id },
          });
          results.created++;
        }
      } catch (err) {
        results.errors.push({
          row: index + 2,
          reason: err instanceof Error ? err.message : String(err),
        });
        results.skipped++;
      }
    }

    log.info("csv import complete", {
      userId: user.id,
      total: results.total,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
    });
    await auditLog(user.id, "CSV_IMPORT_PROFESSORS", {
      total: results.total,
      created: results.created,
      updated: results.updated,
    });

    return apiResponse(results);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Import failed"));
  }
}
