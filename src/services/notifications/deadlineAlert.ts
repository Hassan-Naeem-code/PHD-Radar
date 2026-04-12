import { prisma } from "@/lib/prisma";

export async function checkDeadlineAlerts() {
  const now = new Date();
  const alertWindows = [
    { days: 7, label: "7 days" },
    { days: 3, label: "3 days" },
    { days: 1, label: "1 day" },
  ];

  const notifications = [];

  for (const window of alertWindows) {
    const targetDate = new Date(now.getTime() + window.days * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const upcomingApps = await prisma.application.findMany({
      where: {
        deadline: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["RESEARCHING", "IN_PROGRESS"] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    for (const app of upcomingApps) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: app.userId,
          type: "DEADLINE_APPROACHING",
          actionUrl: `/applications/${app.id}`,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const notification = await prisma.notification.create({
          data: {
            userId: app.userId,
            type: "DEADLINE_APPROACHING",
            title: `Deadline in ${window.label}: ${app.universityName}`,
            message: `Your ${app.program} application to ${app.universityName} is due in ${window.label}.`,
            actionUrl: `/applications/${app.id}`,
          },
        });
        notifications.push(notification);
      }
    }
  }

  return notifications;
}
