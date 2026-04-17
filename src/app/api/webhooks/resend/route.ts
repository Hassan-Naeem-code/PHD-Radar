import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const log = logger.child({ module: "resend-webhook" });

function extractAddress(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const match = /<([^>]+)>/.exec(raw);
  return (match?.[1] ?? raw).trim().toLowerCase() || null;
}

// Verifies the Svix signature format that Resend uses.
// Secret format: "whsec_<base64>"; signed payload is "<id>.<timestamp>.<body>"
// Header "svix-signature" is a space-separated list like "v1,<base64> v1a,<base64>"
function tryVerifySvix(body: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !timestamp || !sigHeader) return false;

  const ts = parseInt(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 5 * 60) {
    return false;
  }

  const secretBytes = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret);
  const payload = `${id}.${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(payload)
    .digest("base64");

  const sigs = sigHeader.split(" ").map((s) => {
    const [ver, val] = s.split(",");
    return { ver, val };
  });
  for (const { ver, val } of sigs) {
    if (ver !== "v1" || !val) continue;
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(expected, "base64"),
          Buffer.from(val, "base64")
        )
      ) {
        return true;
      }
    } catch {
      // width mismatch — skip
    }
  }
  return false;
}

function tryVerifyHmac(body: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = headers.get("x-webhook-signature") ?? headers.get("x-resend-signature");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature.replace(/^sha256=/, ""), "hex")
    );
  } catch {
    return false;
  }
}

interface InboundEvent {
  type?: string;
  created_at?: string;
  data?: {
    from?: string | { email?: string };
    to?: string | string[] | Array<{ email?: string }>;
    subject?: string;
    text?: string;
    html?: string;
    email_id?: string;
    in_reply_to?: string;
  };
}

async function handleInbound(event: InboundEvent) {
  const data = event.data ?? {};
  const fromRaw = typeof data.from === "string" ? data.from : data.from?.email;
  const from = extractAddress(fromRaw);
  if (!from) return { matched: false, reason: "no from address" };

  const professor = await prisma.professor.findFirst({
    where: { email: { equals: from, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!professor) return { matched: false, reason: "no professor with that email" };

  const latestOutreach = await prisma.outreachEmail.findFirst({
    where: {
      professorId: professor.id,
      sentAt: { not: null },
      responseReceived: false,
    },
    orderBy: { sentAt: "desc" },
  });

  if (!latestOutreach) {
    return { matched: false, reason: "no pending outreach" };
  }

  const summary = (data.text ?? data.subject ?? "").slice(0, 1000);

  await prisma.$transaction([
    prisma.outreachEmail.update({
      where: { id: latestOutreach.id },
      data: {
        responseReceived: true,
        responseDate: new Date(),
        responseSummary: summary,
      },
    }),
    prisma.savedProfessor.updateMany({
      where: {
        userId: latestOutreach.userId,
        professorId: professor.id,
      },
      data: { status: "RESPONDED_POSITIVE" },
    }),
    prisma.notification.create({
      data: {
        userId: latestOutreach.userId,
        type: "REPLY_RECEIVED",
        title: `${professor.name} replied!`,
        message: data.subject ? `Re: ${data.subject}` : "You have a new reply",
        actionUrl: `/outreach`,
      },
    }),
  ]);

  return { matched: true, outreachId: latestOutreach.id, professorId: professor.id };
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  if (!tryVerifySvix(body, req.headers) && !tryVerifyHmac(body, req.headers)) {
    log.warn("signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: InboundEvent;
  try {
    event = JSON.parse(body) as InboundEvent;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const type = event.type ?? "";
  if (!type.startsWith("email.") && type !== "inbound.received") {
    return new Response("OK", { status: 200 });
  }

  try {
    const result = await handleInbound(event);
    log.info("inbound processed", { type, ...result });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    log.error("inbound handler failed", { err });
    return new Response("Handler error", { status: 500 });
  }
}
