import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.auditLog.create({
            data: {
              userId,
              action: "SUBSCRIPTION_CREATED",
              details: { sessionId: session.id },
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await prisma.auditLog.create({
            data: {
              userId,
              action: "SUBSCRIPTION_CANCELLED",
              details: { subscriptionId: subscription.id },
            },
          });
        }
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
}
