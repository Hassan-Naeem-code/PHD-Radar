import {
  calculateResearchAlignmentScore,
  calculateFundingScore,
  calculateAccessibilityScore,
  calculateOverallMatchScore,
} from "@/utils/scoring";

describe("calculateResearchAlignmentScore", () => {
  it("returns 0 for empty inputs", () => {
    expect(calculateResearchAlignmentScore([], [])).toBe(0);
    expect(calculateResearchAlignmentScore(["AI"], [])).toBe(0);
    expect(calculateResearchAlignmentScore([], ["AI"])).toBe(0);
  });

  it("returns high score for exact matches", () => {
    const score = calculateResearchAlignmentScore(
      ["trustworthy AI", "neural network verification"],
      ["trustworthy AI", "neural network verification", "formal methods"]
    );
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it("returns partial score for partial overlap", () => {
    const score = calculateResearchAlignmentScore(
      ["machine learning", "computer vision"],
      ["natural language processing", "machine learning"]
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it("returns low score for no overlap", () => {
    const score = calculateResearchAlignmentScore(
      ["quantum computing"],
      ["marine biology"]
    );
    expect(score).toBeLessThan(30);
  });

  it("is case-insensitive", () => {
    const s1 = calculateResearchAlignmentScore(["AI Safety"], ["ai safety"]);
    const s2 = calculateResearchAlignmentScore(["ai safety"], ["AI Safety"]);
    expect(s1).toBe(s2);
  });

  it("never exceeds 100", () => {
    const score = calculateResearchAlignmentScore(
      ["AI", "ML", "DL"],
      ["AI", "ML", "DL"]
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("calculateFundingScore", () => {
  it("returns 0 for no funding signals", () => {
    expect(calculateFundingScore(false, 0, 0, false)).toBe(0);
  });

  it("scores high for active funding + looking for students", () => {
    const score = calculateFundingScore(true, 3, 2, true);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("gives partial score for looking for students without funding", () => {
    const score = calculateFundingScore(false, 0, 0, true);
    expect(score).toBe(25);
  });

  it("caps at 100", () => {
    const score = calculateFundingScore(true, 20, 10, true);
    expect(score).toBe(100);
  });
});

describe("calculateAccessibilityScore", () => {
  it("returns base score for no info", () => {
    expect(calculateAccessibilityScore(null, null, null, null)).toBe(50);
  });

  it("boosts for assistant professors", () => {
    const assistant = calculateAccessibilityScore("Assistant Professor", null, null, null);
    const full = calculateAccessibilityScore("Professor", null, null, null);
    expect(assistant).toBeGreaterThan(full);
  });

  it("boosts for international students", () => {
    const with_ = calculateAccessibilityScore(null, null, true, null);
    const without = calculateAccessibilityScore(null, null, false, null);
    expect(with_).toBeGreaterThan(without);
  });
});

describe("calculateOverallMatchScore", () => {
  it("computes weighted average", () => {
    const score = calculateOverallMatchScore(80, 60, 70);
    // 80*0.5 + 60*0.3 + 70*0.2 = 40 + 18 + 14 = 72
    expect(score).toBe(72);
  });

  it("handles all zeros", () => {
    expect(calculateOverallMatchScore(0, 0, 0)).toBe(0);
  });

  it("handles all 100s", () => {
    expect(calculateOverallMatchScore(100, 100, 100)).toBe(100);
  });
});
