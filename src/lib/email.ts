import crypto from "crypto";
import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "PhDRadar <notifications@phdradar.com>";

function unsubscribeHeaders(userId: string, type: "digest" | "reminders" | "alerts") {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return {};

  const token = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${type}`)
    .digest("hex");

  const base = process.env.NEXTAUTH_URL ?? "https://phdradar.com";
  const url = `${base}/api/unsubscribe?uid=${userId}&type=${type}&token=${token}`;

  return {
    headers: {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export async function sendWelcomeEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to PhDRadar — Let's find your PhD advisor",
    html: `<h2>Welcome, ${name}!</h2>
<p>You've taken the first step toward finding your ideal PhD advisor.</p>
<p>Here's what you can do next:</p>
<ul>
  <li><strong>Complete your profile</strong> — Better matching starts with a complete research profile</li>
  <li><strong>Search for professors</strong> — Discover professors with active funding in your area</li>
  <li><strong>Generate outreach emails</strong> — AI-crafted emails that reference specific papers</li>
</ul>
<p>Good luck with your PhD journey!</p>
<p>— The PhDRadar Team</p>`,
  });
}

export async function sendFollowUpReminder(
  to: string,
  userName: string,
  professorName: string,
  university: string,
  composeUrl: string,
  userId: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Follow-up reminder: ${professorName} (${university})`,
    html: `<h2>Time to follow up, ${userName}</h2>
<p>It's been 14 days since you emailed <strong>${professorName}</strong> at ${university}.</p>
<p>Professors are busy — a polite follow-up can make the difference.</p>
<p><a href="https://phdradar.com${composeUrl}" style="display:inline-block;padding:10px 20px;background:#4361ee;color:white;border-radius:6px;text-decoration:none">Draft Follow-up Email</a></p>
<p style="margin-top:24px;font-size:12px;color:#888">You can manage email preferences in <a href="https://phdradar.com/settings">Settings</a>.</p>
<p>— PhDRadar</p>`,
    ...unsubscribeHeaders(userId, "reminders"),
  });
}

export async function sendDeadlineAlert(
  to: string,
  userName: string,
  universityName: string,
  program: string,
  daysLeft: number,
  appUrl: string,
  userId: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Deadline in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}: ${universityName}`,
    html: `<h2>Deadline approaching, ${userName}</h2>
<p>Your <strong>${program}</strong> application to <strong>${universityName}</strong> is due in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
<p><a href="https://phdradar.com${appUrl}" style="display:inline-block;padding:10px 20px;background:#4361ee;color:white;border-radius:6px;text-decoration:none">Check Application Status</a></p>
<p style="margin-top:24px;font-size:12px;color:#888">You can manage email preferences in <a href="https://phdradar.com/settings">Settings</a>.</p>
<p>— PhDRadar</p>`,
    ...unsubscribeHeaders(userId, "alerts"),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your PhDRadar password",
    html: `<h2>Hi ${name},</h2>
<p>We received a request to reset your PhDRadar password.</p>
<p>Click the button below to choose a new password. This link expires in 1 hour.</p>
<p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4361ee;color:white;border-radius:6px;text-decoration:none">Reset Password</a></p>
<p>Or copy this URL into your browser:<br><code>${resetUrl}</code></p>
<p>If you didn&rsquo;t request this, you can safely ignore this email.</p>
<p>— The PhDRadar Team</p>`,
  });
}

export async function sendVerifyEmail(
  to: string,
  name: string,
  verifyUrl: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your PhDRadar email",
    html: `<h2>Welcome, ${name}!</h2>
<p>Please confirm this is your email address so we can keep your account secure.</p>
<p><a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#4361ee;color:white;border-radius:6px;text-decoration:none">Verify Email</a></p>
<p>Or copy this URL into your browser:<br><code>${verifyUrl}</code></p>
<p>This link expires in 24 hours.</p>
<p>— The PhDRadar Team</p>`,
  });
}

export async function sendWeeklyDigest(
  to: string,
  userName: string,
  newMatches: { name: string; university: string; score: number }[],
  userId: string
) {
  const matchList = newMatches
    .map((m) => `<li><strong>${m.name}</strong> at ${m.university} — Score: ${m.score}/100</li>`)
    .join("");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${newMatches.length} new professor matches this week`,
    html: `<h2>Weekly Matches for ${userName}</h2>
<p>We found ${newMatches.length} new professors that match your research interests:</p>
<ul>${matchList}</ul>
<p><a href="https://phdradar.com/discover" style="display:inline-block;padding:10px 20px;background:#4361ee;color:white;border-radius:6px;text-decoration:none">Explore Matches</a></p>
<p style="margin-top:24px;font-size:12px;color:#888">You can manage email preferences in <a href="https://phdradar.com/settings">Settings</a>.</p>
<p>— PhDRadar</p>`,
    ...unsubscribeHeaders(userId, "digest"),
  });
}
