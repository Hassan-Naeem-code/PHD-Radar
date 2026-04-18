import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError, NotFoundError, ValidationError, RateLimitError } from "@/lib/errors";
import { requireAuth, auditLog } from "@/lib/api-auth";
import { getAiLimiter, checkRateLimit } from "@/lib/rate-limit";
import { anthropic } from "@/lib/anthropic";

interface ImplementationGuide {
  complexity: string;
  estimatedTime: string;
  hasPublicCode: boolean;
  hasPublicDataset: boolean;
  whyThisPaper: string[];
  coreComponents: string[];
  keyDependencies: string[];
  evaluationTargets: string[];
  steps: Array<{ title: string; description: string }>;
}

async function generateGuide(paper: {
  title: string;
  abstract: string;
  authors: string[];
  venue: string | null;
  year: number;
  url: string | null;
}): Promise<ImplementationGuide> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system:
      "You are a research implementation advisor. Generate practical implementation guides for academic papers targeting prospective PhD students. Return valid JSON only.",
    messages: [
      {
        role: "user",
        content: `Generate an implementation guide for this paper:

Title: ${paper.title}
Authors: ${paper.authors.join(", ")}
Venue: ${paper.venue ?? "Unknown"} (${paper.year})
Abstract: ${paper.abstract}
URL: ${paper.url ?? "N/A"}

Return JSON:
{
  "complexity": "<Easy|Medium|Hard>",
  "estimatedTime": "<e.g. 1-2 weeks>",
  "hasPublicCode": <true if paper likely has public code based on content>,
  "hasPublicDataset": <true if paper uses standard public datasets>,
  "whyThisPaper": ["<reason1>", "<reason2>", "<reason3>"],
  "coreComponents": ["<component1>", "<component2>"],
  "keyDependencies": ["<dep1>", "<dep2>"],
  "evaluationTargets": ["<target1>", "<target2>"],
  "steps": [
    {"title": "<step title>", "description": "<brief description>"},
    ...
  ]
}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { success } = await checkRateLimit(getAiLimiter(), user.id);
    if (!success) throw new RateLimitError();

    const { id } = await params;
    const paper = await prisma.publication.findUnique({
      where: { id },
      include: {
        professor: {
          select: {
            id: true,
            name: true,
            university: { select: { name: true, shortName: true } },
          },
        },
      },
    });
    if (!paper) throw new NotFoundError("Paper");
    if (!paper.abstract) throw new ValidationError("Paper has no abstract for guide generation");

    const guide = await generateGuide({
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      url: paper.url,
    });

    await auditLog(user.id, "IMPLEMENTATION_GUIDE_GENERATED", { paperId: id });

    return apiResponse({
      paper: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        venue: paper.venue,
        year: paper.year,
        url: paper.url,
        citationCount: paper.citationCount,
        summary: paper.summary,
        keyFindings: paper.keyFindings,
        futureWork: paper.futureWork,
      },
      professor: paper.professor,
      guide,
    });
  } catch (error) {
    if (error instanceof Error) return apiError(error);
    return apiError(new Error("Guide generation failed"));
  }
}
