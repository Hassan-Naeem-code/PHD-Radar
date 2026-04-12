export function calculateResearchAlignmentScore(
  userInterests: string[],
  professorAreas: string[]
): number {
  if (!userInterests.length || !professorAreas.length) return 0;

  const normalizedUser = userInterests.map((i) => i.toLowerCase().trim());
  const normalizedProf = professorAreas.map((a) => a.toLowerCase().trim());

  let matchCount = 0;
  for (const interest of normalizedUser) {
    for (const area of normalizedProf) {
      if (area.includes(interest) || interest.includes(area)) {
        matchCount++;
        break;
      }
    }
  }

  const keywordOverlap = (matchCount / normalizedUser.length) * 60;

  const userTokens = new Set(normalizedUser.flatMap((i) => i.split(/\s+/)));
  const profTokens = new Set(normalizedProf.flatMap((a) => a.split(/\s+/)));
  const intersection = [...userTokens].filter((t) => profTokens.has(t));
  const tokenBonus = Math.min((intersection.length / userTokens.size) * 40, 40);

  return Math.min(Math.round(keywordOverlap + tokenBonus), 100);
}

export function calculateFundingScore(
  hasActiveFunding: boolean,
  grantCount: number,
  recentGrantCount: number,
  lookingForStudents: boolean
): number {
  let score = 0;

  if (hasActiveFunding) score += 40;
  if (lookingForStudents) score += 25;

  score += Math.min(grantCount * 5, 20);
  score += Math.min(recentGrantCount * 10, 15);

  return Math.min(score, 100);
}

export function calculateAccessibilityScore(
  title: string | null,
  currentPhDStudents: number | null,
  internationalStudents: boolean | null,
  responsivenessScore: number | null
): number {
  let score = 50;

  if (title) {
    const lower = title.toLowerCase();
    if (lower.includes("assistant")) score += 20;
    else if (lower.includes("associate")) score += 10;
    else if (lower.includes("full") || lower === "professor") score += 0;
  }

  if (currentPhDStudents !== null) {
    if (currentPhDStudents < 3) score += 10;
    else if (currentPhDStudents > 8) score -= 10;
  }

  if (internationalStudents === true) score += 10;

  if (responsivenessScore !== null) {
    score += Math.round((responsivenessScore - 50) * 0.2);
  }

  return Math.max(0, Math.min(score, 100));
}

export function calculateOverallMatchScore(
  researchAlignment: number,
  fundingScore: number,
  accessibilityScore: number
): number {
  return Math.round(
    researchAlignment * 0.5 + fundingScore * 0.3 + accessibilityScore * 0.2
  );
}
