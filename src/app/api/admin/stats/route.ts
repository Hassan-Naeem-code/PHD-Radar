import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersThisWeek,
      totalProfessors,
      profsThisWeek,
      searchesToday,
      searchesPrev,
      qualityLow,
      qualityMedium,
      qualityHigh,
      totalSavedProfs,
      activeUsersToday,
      planCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.professor.count(),
      prisma.professor.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.search.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.search.count({
        where: {
          createdAt: {
            gte: new Date(dayAgo.getTime() - 24 * 60 * 60 * 1000),
            lt: dayAgo,
          },
        },
      }),
      prisma.professor.count({ where: { dataQuality: "LOW" } }),
      prisma.professor.count({ where: { dataQuality: "MEDIUM" } }),
      prisma.professor.count({ where: { dataQuality: "HIGH" } }),
      prisma.savedProfessor.count(),
      prisma.session.count({ where: { expires: { gte: now } } }),
      prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
    ]);

    const activatedUsers = await prisma.user.count({
      where: { savedProfessors: { some: {} } },
    });
    const activationRate = totalUsers > 0
      ? Math.round((activatedUsers / totalUsers) * 100)
      : 0;
    const avgProfsSaved = activatedUsers > 0
      ? Number((totalSavedProfs / activatedUsers).toFixed(1))
      : 0;

    const paidUsers = planCounts
      .filter((p) => p.plan !== "FREE")
      .reduce((sum, p) => sum + p._count._all, 0);
    const conversionRate = totalUsers > 0
      ? Math.round((paidUsers / totalUsers) * 100)
      : 0;

    return apiResponse({
      totals: {
        users: totalUsers,
        professors: totalProfessors,
        savedProfessors: totalSavedProfs,
        paidUsers,
      },
      changes: {
        newUsers7d: usersThisWeek,
        newProfessors7d: profsThisWeek,
        searchesToday,
        searchesChangePct: searchesPrev > 0
          ? Math.round(((searchesToday - searchesPrev) / searchesPrev) * 100)
          : 0,
      },
      quality: {
        HIGH: qualityHigh,
        MEDIUM: qualityMedium,
        LOW: qualityLow,
      },
      plans: planCounts.reduce<Record<string, number>>((acc, p) => {
        acc[p.plan] = p._count._all;
        return acc;
      }, {}),
      funnel: {
        activationRate,
        avgProfessorsSaved: avgProfsSaved,
        conversionRate,
      },
      health: {
        activeSessions: activeUsersToday,
      },
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Internal server error"));
  }
}
