import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    });

    if (!dbUser?.stripeCustomerId) {
      throw new ValidationError("No Stripe customer on file");
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    await auditLog(user.id, "PORTAL_ACCESSED");

    return apiResponse({ url: session.url });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Portal creation failed"));
  }
}
