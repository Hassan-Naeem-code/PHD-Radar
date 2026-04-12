import { anthropic } from "@/lib/anthropic";

interface AnalysisInput {
  userResearchInterests: string[];
  userSkills: string[];
  userIndustryYears: number | null;
  professorName: string;
  universityName: string;
  researchAreas: string[];
  recentPapers: string[];
  activeGrants: string[];
}

interface ResearchFitResult {
  fitScore: number;
  explanation: string;
  talkingPoints: string[];
  suggestedQuestion: string;
  industryConnection: string;
}

export async function analyzeResearchFit(
  input: AnalysisInput
): Promise<ResearchFitResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system:
      "You are a PhD admissions advisor. Analyze research fit between a prospective student and a professor. Return valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Student Profile:
- Research Interests: ${input.userResearchInterests.join(", ")}
- Industry Experience: ${input.userIndustryYears ?? 0} years in ${input.userSkills.join(", ")}

Professor Profile:
- Name: ${input.professorName} at ${input.universityName}
- Research Areas: ${input.researchAreas.join(", ")}
- Recent Papers: ${input.recentPapers.join("; ")}
- Active Grants: ${input.activeGrants.join("; ")}

Return JSON with:
{
  "fitScore": <0-100>,
  "explanation": "<2-3 sentences on research alignment>",
  "talkingPoints": ["<point1>", "<point2>", "<point3>"],
  "suggestedQuestion": "<1 intelligent question about their work>",
  "industryConnection": "<how student's industry experience connects to research>"
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
