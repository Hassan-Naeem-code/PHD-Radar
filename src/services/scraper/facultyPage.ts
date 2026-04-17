import { anthropic } from "@/lib/anthropic";

export interface ExtractedFacultyInfo {
  email: string | null;
  phone: string | null;
  labName: string | null;
  labWebsite: string | null;
  researchAreas: string[];
  lookingForStudents: boolean;
  lookingForStudentsEvidence: string | null;
  recentAnnouncements: string[];
}

const MAX_FETCH_BYTES = 500_000;
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "phdradar-bot/1.0 (+https://phdradar.com)" },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, MAX_FETCH_BYTES);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20_000);
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;

export async function scrapeFacultyPage(url: string): Promise<ExtractedFacultyInfo | null> {
  const html = await fetchWithTimeout(url);
  if (!html) return null;

  const text = htmlToText(html);
  const quickEmail = EMAIL_RE.exec(text)?.[0] ?? null;
  const quickPhone = PHONE_RE.exec(text)?.[0] ?? null;

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      email: quickEmail,
      phone: quickPhone,
      labName: null,
      labWebsite: null,
      researchAreas: [],
      lookingForStudents: false,
      lookingForStudentsEvidence: null,
      recentAnnouncements: [],
    };
  }

  const prompt = `Extract professor information from the following faculty page text. Return strict JSON only.

Page content (truncated):
"""
${text}
"""

Return JSON with this shape:
{
  "email": "<best email or null>",
  "phone": "<best phone or null>",
  "labName": "<named research lab or null>",
  "labWebsite": "<lab website URL or null>",
  "researchAreas": ["<area1>", "<area2>"],
  "lookingForStudents": <true|false>,
  "lookingForStudentsEvidence": "<exact sentence or null>",
  "recentAnnouncements": ["<announcement1>"]
}

Rules: Only set lookingForStudents=true if the page explicitly says they are recruiting or have open positions. Be conservative with researchAreas (4-8 items max).`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: "You extract structured faculty data from HTML. Return valid JSON only.",
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(content) as ExtractedFacultyInfo;
    return {
      email: parsed.email ?? quickEmail,
      phone: parsed.phone ?? quickPhone,
      labName: parsed.labName ?? null,
      labWebsite: parsed.labWebsite ?? null,
      researchAreas: parsed.researchAreas ?? [],
      lookingForStudents: parsed.lookingForStudents ?? false,
      lookingForStudentsEvidence: parsed.lookingForStudentsEvidence ?? null,
      recentAnnouncements: parsed.recentAnnouncements ?? [],
    };
  } catch {
    return {
      email: quickEmail,
      phone: quickPhone,
      labName: null,
      labWebsite: null,
      researchAreas: [],
      lookingForStudents: false,
      lookingForStudentsEvidence: null,
      recentAnnouncements: [],
    };
  }
}
