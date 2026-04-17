import { NextRequest } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ForbiddenError, ValidationError, ExternalAPIError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const email = await prisma.outreachEmail.findUnique({
      where: { id },
      include: { professor: { select: { name: true, email: true } } },
    });
    if (!email) throw new NotFoundError("Email");
    if (email.userId !== user.id) throw new ForbiddenError();
    if (email.sentAt) throw new ValidationError("Email already sent");
    if (!email.professor.email) throw new ValidationError("Professor email unknown");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new ValidationError("Email sending is not configured");

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, name: true },
    });

    const from = process.env.EMAIL_FROM || "PhDRadar <notifications@phdradar.com>";
    const replyTo = dbUser?.email;

    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: email.professor.email,
        replyTo,
        subject: email.subject,
        text: email.body,
      });
    } catch (err) {
      throw new ExternalAPIError("Resend", err instanceof Error ? err : new Error(String(err)));
    }

    const updated = await prisma.outreachEmail.update({
      where: { id },
      data: { sentAt: new Date() },
    });

    await prisma.savedProfessor.updateMany({
      where: { userId: user.id, professorId: email.professorId },
      data: { status: "EMAIL_SENT" },
    });

    await auditLog(user.id, "EMAIL_SENT", { emailId: id, professorId: email.professorId });

    return apiResponse(updated);
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Send failed"));
  }
}
