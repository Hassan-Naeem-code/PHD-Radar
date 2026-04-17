import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      savedTotal,
      savedThisWeek,
      emailsSentTotal,
      emailsThisWeek,
      responsesTotal,
      applicationsTotal,
      applicationsSubmitted,
      upcomingDeadlines,
      recentEmails,
      topMatches,
    ] = await Promise.all([
      prisma.savedProfessor.count({ where: { userId } }),
      prisma.savedProfessor.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.outreachEmail.count({ where: { userId, sentAt: { not: null } } }),
      prisma.outreachEmail.count({ where: { userId, sentAt: { gte: weekAgo } } }),
      prisma.outreachEmail.count({ where: { userId, responseReceived: true } }),
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, status: "SUBMITTED" } }),
      prisma.application.findMany({
        where: {
          userId,
          deadline: { gte: now },
          status: { in: ["RESEARCHING", "IN_PROGRESS"] },
        },
        orderBy: { deadline: "asc" },
        take: 5,
        select: {
          id: true, universityName: true, program: true, deadline: true,
        },
      }),
      prisma.outreachEmail.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { professor: { select: { name: true } } },
      }),
      prisma.savedProfessor.findMany({
        where: { userId },
        orderBy: [{ researchFitScore: "desc" }, { createdAt: "desc" }],
        take: 3,
        include: {
          professor: {
            select: {
              id: true,
              name: true,
              hasActiveFunding: true,
              university: { select: { shortName: true, name: true } },
            },
          },
        },
      }),
    ]);

    const responseRate = emailsSentTotal > 0
      ? Math.round((responsesTotal / emailsSentTotal) * 100)
      : 0;

    return apiResponse({
      stats: {
        savedProfessors: { value: savedTotal, change: savedThisWeek },
        emailsSent: { value: emailsSentTotal, change: emailsThisWeek },
        responses: { value: responsesTotal, rate: responseRate },
        applications: { value: applicationsTotal, submitted: applicationsSubmitted },
      },
      upcomingDeadlines: upcomingDeadlines.map((d) => ({
        id: d.id,
        university: d.universityName,
        program: d.program,
        deadline: d.deadline,
        daysLeft: d.deadline
          ? Math.ceil((new Date(d.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
      recentActivity: recentEmails.map((e) => ({
        id: e.id,
        professor: e.professor.name,
        action: e.sentAt ? "Email sent" : "Draft ready",
        status: e.sentAt ? "EMAIL_SENT" : "EMAIL_DRAFTED",
        createdAt: e.createdAt,
      })),
      topMatches: topMatches.map((s) => ({
        id: s.professor.id,
        name: s.professor.name,
        university: s.professor.university.shortName ?? s.professor.university.name,
        funded: s.professor.hasActiveFunding,
        score: Math.round(s.researchFitScore ?? 0),
      })),
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
