import { prisma } from "@/lib/prisma";

export async function checkFollowUpReminders() {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const pendingFollowUps = await prisma.outreachEmail.findMany({
    where: {
      type: "COLD_OUTREACH",
      sentAt: { lte: fourteenDaysAgo },
      responseReceived: false,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      professor: {
        select: { name: true, university: { select: { shortName: true } } },
      },
    },
  });

  const notifications = [];

  for (const email of pendingFollowUps) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: email.userId,
        type: "FOLLOW_UP_DUE",
        actionUrl: `/outreach/compose/${email.professorId}`,
        createdAt: { gte: fourteenDaysAgo },
      },
    });

    if (!existing) {
      const notification = await prisma.notification.create({
        data: {
          userId: email.userId,
          type: "FOLLOW_UP_DUE",
          title: `Follow up with ${email.professor.name}`,
          message: `It's been 14 days since your email to ${email.professor.name} (${email.professor.university.shortName}). Consider sending a follow-up.`,
          actionUrl: `/outreach/compose/${email.professorId}`,
        },
      });
      notifications.push(notification);
    }
  }

  return notifications;
}
