import { getServerSession } from "next-auth";
import { type Prisma } from "@prisma/client";
import { authOptions } from "./auth";
import { UnauthorizedError } from "./errors";
import { prisma } from "./prisma";

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new UnauthorizedError();
  }

  const user = session.user as SessionUser;
  if (!user.id) {
    // Fallback: look up by email if id not in token
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    });
    if (!dbUser) throw new UnauthorizedError();
    return { id: dbUser.id, email: dbUser.email, role: dbUser.role };
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new UnauthorizedError();
  }
  return user;
}

export function verifyCsrf(req: Request): void {
  // For mutating requests (POST/PUT/DELETE), verify the origin matches
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) return; // Allow server-to-server calls without origin

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new UnauthorizedError();
  }
}

export async function auditLog(
  userId: string,
  action: string,
  details?: Record<string, unknown>,
  req?: Request
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      details: (details as Prisma.InputJsonValue) ?? undefined,
      ipAddress:
        req?.headers.get("x-forwarded-for") ??
        req?.headers.get("x-real-ip") ??
        null,
      userAgent: req?.headers.get("user-agent") ?? null,
    },
  });
}
