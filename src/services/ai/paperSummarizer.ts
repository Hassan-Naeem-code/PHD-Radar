import { anthropic } from "@/lib/anthropic";

interface PaperInput {
  title: string;
  abstract: string;
  authors: string[];
  venue: string | null;
  year: number;
}

interface PaperSummary {
  summary: string;
  keyFindings: string[];
  futureWork: string[];
  techniques: string[];
}

export async function summarizePaper(paper: PaperInput): Promise<PaperSummary> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system:
      "You are a research paper analyst. Summarize academic papers for prospective PhD students. Return valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Summarize this paper:

Title: ${paper.title}
Authors: ${paper.authors.join(", ")}
Venue: ${paper.venue ?? "Unknown"} (${paper.year})
Abstract: ${paper.abstract}

Return JSON:
{
  "summary": "<2-3 sentence plain-English summary>",
  "keyFindings": ["<finding1>", "<finding2>"],
  "futureWork": ["<direction1>", "<direction2>"],
  "techniques": ["<technique1>", "<technique2>"]
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
