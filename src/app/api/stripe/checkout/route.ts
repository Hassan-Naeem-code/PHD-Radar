import { NextRequest } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, ValidationError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

const bodySchema = z.object({
  plan: z.enum(["PRO", "PREMIUM"]),
});

const PRICE_BY_PLAN: Record<"PRO" | "PREMIUM", string | undefined> = {
  PRO: process.env.STRIPE_PRICE_PRO,
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM,
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { plan } = bodySchema.parse(await req.json());

    const priceId = PRICE_BY_PLAN[plan];
    if (!priceId) throw new ValidationError(`Stripe price not configured for plan ${plan}`);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, stripeCustomerId: true },
    });
    if (!dbUser) throw new ValidationError("User not found");

    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      allow_promotion_codes: true,
    });

    await auditLog(user.id, "CHECKOUT_CREATED", { plan, sessionId: session.id });

    return apiResponse({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Checkout creation failed"));
  }
}
