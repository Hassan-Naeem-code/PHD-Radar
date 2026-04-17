import { PrismaClient } from "@prisma/client";

/**
 * Playwright global teardown — clean up test users created during E2E runs.
 * Only deletes users with the e2e test email pattern to avoid touching real data.
 */
export default async function globalTeardown() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    await prisma.user.deleteMany({
      where: { email: { contains: "@phdradar.test" } },
    });
  } finally {
    await prisma.$disconnect();
  }
}
