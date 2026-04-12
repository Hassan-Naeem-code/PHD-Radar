import { anthropic } from "@/lib/anthropic";

interface FundingInput {
  professorName: string;
  grants: { title: string; agency: string; amount: number | null; endDate: string | null }[];
  recentPaperCount: number | null;
  currentPhDStudents: number | null;
  lookingForStudents: boolean;
  title: string | null;
}

interface FundingPrediction {
  score: number;
  confidence: string;
  signals: string[];
  recommendation: string;
}

export async function predictFunding(
  input: FundingInput
): Promise<FundingPrediction> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system:
      "You are a funding analyst for academic research. Predict likelihood of PhD funding. Return valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Analyze funding likelihood for Dr. ${input.professorName}:

Active Grants: ${input.grants.map((g) => `${g.title} (${g.agency}, $${g.amount ?? "unknown"}, ends ${g.endDate ?? "unknown"})`).join("; ") || "None found"}
Recent Papers (3yr): ${input.recentPaperCount ?? "Unknown"}
Current PhD Students: ${input.currentPhDStudents ?? "Unknown"}
Looking for Students: ${input.lookingForStudents ? "Yes" : "Unknown"}
Title: ${input.title ?? "Unknown"}

Return JSON:
{
  "score": <0-100 funding likelihood>,
  "confidence": "<low|medium|high>",
  "signals": ["<positive or negative signal>", ...],
  "recommendation": "<1-2 sentence recommendation for the student>"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
