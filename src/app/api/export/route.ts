import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const str = val === null || val === undefined ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    const format = url.searchParams.get("format") || "csv";

    await auditLog(userId, "DATA_EXPORTED", { type, format });

    if (type === "professors") {
      const saved = await prisma.savedProfessor.findMany({
        where: { userId },
        include: { professor: { include: { university: true } } },
      });

      const rows = saved.map((s) => ({
        professorName: s.professor.name,
        email: s.professor.email || "",
        university: s.professor.university.name,
        department: s.professor.department || "",
        researchAreas: s.professor.researchAreas.join("; "),
        status: s.status,
        priority: s.priority,
        fitScore: s.researchFitScore || "",
        notes: s.notes || "",
        hasActiveFunding: s.professor.hasActiveFunding,
        savedAt: s.createdAt.toISOString(),
      }));

      if (format === "json") {
        return new Response(JSON.stringify(rows, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="phdradar-professors.json"',
          },
        });
      }

      return new Response(toCSV(rows), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="phdradar-professors.csv"',
        },
      });
    }

    if (type === "outreach") {
      const emails = await prisma.outreachEmail.findMany({
        where: { userId },
        include: { professor: true },
      });

      const rows = emails.map((e) => ({
        professorName: e.professor.name,
        subject: e.subject,
        type: e.type,
        sentAt: e.sentAt?.toISOString() || "",
        responseReceived: e.responseReceived,
        createdAt: e.createdAt.toISOString(),
      }));

      return new Response(toCSV(rows), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="phdradar-outreach.csv"',
        },
      });
    }

    if (type === "applications") {
      const apps = await prisma.application.findMany({
        where: { userId },
      });

      const rows = apps.map((a) => ({
        university: a.universityName,
        program: a.program,
        term: a.term,
        status: a.status,
        deadline: a.deadline?.toISOString() || "",
        sopUploaded: a.sopUploaded,
        cvUploaded: a.cvUploaded,
        transcriptsUploaded: a.transcriptsUploaded,
        recsReceived: `${a.recsReceived}/${a.recsRequested}`,
        toeflSent: a.toeflSent,
        notes: a.notes || "",
      }));

      return new Response(toCSV(rows), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="phdradar-applications.csv"',
        },
      });
    }

    // type === "all" — GDPR full export as JSON
    const [savedProfessors, outreachEmails, applications, profile] = await Promise.all([
      prisma.savedProfessor.findMany({ where: { userId }, include: { professor: { include: { university: true } } } }),
      prisma.outreachEmail.findMany({ where: { userId }, include: { professor: true } }),
      prisma.application.findMany({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, researchInterests: true, skills: true, currentDegree: true, currentSchool: true, createdAt: true } }),
    ]);

    const allData = { profile, savedProfessors, outreachEmails, applications, exportedAt: new Date().toISOString() };

    return new Response(JSON.stringify(allData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="phdradar-full-export.json"',
      },
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
