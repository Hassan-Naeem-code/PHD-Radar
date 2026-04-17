import { anthropic } from "@/lib/anthropic";

export interface FundingGrantInput {
  title: string;
  agency: string;
  amount: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string | null;
}

export interface FundingForecast {
  hasActiveFunding: boolean;
  activeGrantCount: number;
  totalActiveAmount: number;
  expiringWithin12Months: number;
  nearestExpiryDate: string | null;
  averageAnnualGrantCount: number;
  fundingScore: number;
  confidenceBand: "HIGH" | "MEDIUM" | "LOW";
  forecastNextYear: "LIKELY" | "POSSIBLE" | "UNLIKELY";
  signals: string[];
  aiNarrative?: string;
}

function countsByYear(grants: FundingGrantInput[]): Map<number, number> {
  const byYear = new Map<number, number>();
  for (const g of grants) {
    if (!g.startDate) continue;
    const y = new Date(g.startDate).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  return byYear;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function predictFundingRuleBased(
  grants: FundingGrantInput[]
): FundingForecast {
  const now = new Date();
  const active = grants.filter((g) => {
    if (g.status === "Active") return true;
    if (g.endDate && new Date(g.endDate) >= now) return true;
    return false;
  });

  const totalActiveAmount = active.reduce(
    (sum, g) => sum + (g.amount ?? 0),
    0
  );

  const twelveMonthsOut = new Date(now);
  twelveMonthsOut.setMonth(now.getMonth() + 12);
  const expiring = active.filter(
    (g) => g.endDate && new Date(g.endDate) <= twelveMonthsOut
  );
  const nearestExpiry = active
    .map((g) => g.endDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  const byYear = countsByYear(grants);
  const thisYear = now.getFullYear();
  const recentYears = [thisYear - 4, thisYear - 3, thisYear - 2, thisYear - 1, thisYear];
  const recentCounts = recentYears.map((y) => byYear.get(y) ?? 0);
  const averageAnnualGrantCount =
    recentCounts.reduce((a, b) => a + b, 0) / recentCounts.length;

  const signals: string[] = [];
  let fundingScore = 0;

  if (active.length > 0) {
    fundingScore += Math.min(40, active.length * 15);
    signals.push(`${active.length} active grant${active.length === 1 ? "" : "s"}`);
  } else {
    signals.push("no active grants on file");
  }

  if (totalActiveAmount > 1_000_000) {
    fundingScore += 20;
    signals.push(`$${(totalActiveAmount / 1_000_000).toFixed(1)}M total active funding`);
  } else if (totalActiveAmount > 250_000) {
    fundingScore += 10;
    signals.push(`$${Math.round(totalActiveAmount / 1000)}K total active funding`);
  }

  if (averageAnnualGrantCount >= 2) {
    fundingScore += 20;
    signals.push(`~${averageAnnualGrantCount.toFixed(1)} new grants/year`);
  } else if (averageAnnualGrantCount >= 1) {
    fundingScore += 10;
    signals.push(`~${averageAnnualGrantCount.toFixed(1)} new grant/year`);
  }

  if (expiring.length > 0 && expiring.length === active.length && active.length > 0) {
    fundingScore -= 15;
    signals.push(`all ${active.length} active grants expire within 12 months`);
  } else if (expiring.length > 0) {
    signals.push(`${expiring.length} expiring within 12 months`);
  }

  if (nearestExpiry && monthsBetween(now, new Date(nearestExpiry)) < 6) {
    fundingScore -= 5;
    signals.push("nearest grant expires in under 6 months");
  }

  if (active.length > 0 && averageAnnualGrantCount >= 1) {
    fundingScore += 10;
    signals.push("sustained grant cadence");
  }

  fundingScore = Math.max(0, Math.min(100, fundingScore));

  let forecast: FundingForecast["forecastNextYear"];
  if (fundingScore >= 70) forecast = "LIKELY";
  else if (fundingScore >= 35) forecast = "POSSIBLE";
  else forecast = "UNLIKELY";

  const confidence: FundingForecast["confidenceBand"] =
    grants.length >= 5 ? "HIGH" : grants.length >= 2 ? "MEDIUM" : "LOW";

  return {
    hasActiveFunding: active.length > 0,
    activeGrantCount: active.length,
    totalActiveAmount,
    expiringWithin12Months: expiring.length,
    nearestExpiryDate: nearestExpiry
      ? new Date(nearestExpiry).toISOString().slice(0, 10)
      : null,
    averageAnnualGrantCount: Number(averageAnnualGrantCount.toFixed(2)),
    fundingScore,
    confidenceBand: confidence,
    forecastNextYear: forecast,
    signals,
  };
}

export async function predictFundingWithAI(
  grants: FundingGrantInput[],
  professorName: string
): Promise<FundingForecast> {
  const base = predictFundingRuleBased(grants);
  if (!process.env.ANTHROPIC_API_KEY || grants.length === 0) return base;

  const grantSummary = grants
    .slice(0, 10)
    .map((g) =>
      `- "${g.title}" (${g.agency}), $${g.amount ?? "?"}, ` +
      `${g.startDate ? new Date(g.startDate).toISOString().slice(0, 10) : "?"} → ` +
      `${g.endDate ? new Date(g.endDate).toISOString().slice(0, 10) : "?"}, ${g.status ?? "?"}`
    )
    .join("\n");

  const prompt = `You are an academic funding analyst helping a prospective PhD student assess whether ${professorName} will have funding next year.

Signals from the rule-based layer:
- Active grants: ${base.activeGrantCount}
- Active funding total: $${base.totalActiveAmount.toLocaleString()}
- Grants expiring within 12 months: ${base.expiringWithin12Months}
- Average new grants per year (last 5 years): ${base.averageAnnualGrantCount}
- Funding score: ${base.fundingScore}/100
- Rule-based forecast: ${base.forecastNextYear}

Full grant history (up to 10 most recent):
${grantSummary}

Write a concise 2-3 sentence narrative suitable for a student dashboard. Be honest — if the signal is weak, say so. Do not invent grants. Return plain prose only.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You summarize funding outlook for PhD applicants. Prose only, no lists, 2-3 sentences.",
      messages: [{ role: "user", content: prompt }],
    });
    const narrative =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return { ...base, aiNarrative: narrative || undefined };
  } catch {
    return base;
  }
}
