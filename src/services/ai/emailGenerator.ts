import { anthropic } from "@/lib/anthropic";

interface EmailGenerationInput {
  professorName: string;
  universityName: string;
  department: string | null;
  researchAreas: string[];
  recentPapers: { title: string; summary: string | null }[];
  activeGrants: { title: string; agency: string }[];
  studentName: string;
  studentDegree: string | null;
  studentSchool: string | null;
  studentInterests: string[];
  studentSkills: string[];
  studentIndustryYears: number | null;
  emailType: "COLD_OUTREACH" | "FOLLOW_UP" | "THANK_YOU" | "MEETING_REQUEST";
}

interface GeneratedEmail {
  subject: string;
  body: string;
  talkingPoints: string[];
}

export async function generateOutreachEmail(
  input: EmailGenerationInput
): Promise<GeneratedEmail> {
  const paperContext = input.recentPapers
    .slice(0, 3)
    .map((p) => `"${p.title}"${p.summary ? ` — ${p.summary}` : ""}`)
    .join("\n");

  const grantContext = input.activeGrants
    .map((g) => `${g.title} (${g.agency})`)
    .join(", ");

  const prompt =
    input.emailType === "COLD_OUTREACH"
      ? `Generate a personalized cold outreach email from a prospective PhD student to a professor.

Professor:
- Name: Dr. ${input.professorName}
- University: ${input.universityName}, ${input.department ?? "CS"}
- Research: ${input.researchAreas.join(", ")}
- Recent Papers:
${paperContext}
- Active Grants: ${grantContext || "Unknown"}

Student:
- Name: ${input.studentName}
- Current: ${input.studentDegree ?? "Graduate student"} at ${input.studentSchool ?? "university"}
- Research Interests: ${input.studentInterests.join(", ")}
- Skills: ${input.studentSkills.join(", ")}
- Industry Experience: ${input.studentIndustryYears ?? 0} years

Requirements:
- Reference a SPECIFIC paper by name
- Show understanding of a specific technique or finding
- Connect student's industry experience to a research gap
- Ask an intelligent question about future directions
- Request a conversation (not admission)
- Professional but genuine tone
- Under 250 words

Return JSON:
{
  "subject": "<email subject>",
  "body": "<full email body>",
  "talkingPoints": ["<key point referenced in email>", "<second point>", "<third point>"]
}`
      : `Generate a ${input.emailType.toLowerCase().replace("_", " ")} email from ${input.studentName} to Dr. ${input.professorName} at ${input.universityName}.

Context: Student researches ${input.studentInterests.join(", ")}.

Return JSON:
{
  "subject": "<email subject>",
  "body": "<full email body>",
  "talkingPoints": ["<key point>"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system:
      "You are an expert at writing personalized academic outreach emails. Return valid JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
