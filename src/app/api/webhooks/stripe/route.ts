import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@prisma/client";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "stripe-webhook" });

export const runtime = "nodejs";

function planFromPriceId(priceId: string | null | undefined): SubscriptionPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "PREMIUM";
  return null;
}

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId) return;

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId) ?? ((session.metadata?.plan as SubscriptionPlan) ?? "PRO");
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
      planExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_CREATED",
      details: { sessionId: session.id, plan, subscriptionId: subscription.id },
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId) ?? user.plan;
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      planExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "SUBSCRIPTION_UPDATED",
      details: { plan, subscriptionId: subscription.id, status: subscription.status },
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
      planExpiresAt: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "SUBSCRIPTION_CANCELLED",
      details: { subscriptionId: subscription.id },
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    log.error("signature verification failed", { err: error });
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
    }

    log.info("handled event", { type: event.type, id: event.id });
    return new Response("OK", { status: 200 });
  } catch (error) {
    log.error("handler error", { err: error, type: event.type });
    return new Response("Handler error", { status: 500 });
  }
}
