import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum(["PRO", "PREMIUM"]),
});

describe("stripe checkout validation", () => {
  it("accepts PRO plan", () => {
    expect(bodySchema.parse({ plan: "PRO" }).plan).toBe("PRO");
  });

  it("accepts PREMIUM plan", () => {
    expect(bodySchema.parse({ plan: "PREMIUM" }).plan).toBe("PREMIUM");
  });

  it("rejects FREE plan", () => {
    expect(() => bodySchema.parse({ plan: "FREE" })).toThrow();
  });

  it("rejects unknown plan", () => {
    expect(() => bodySchema.parse({ plan: "ENTERPRISE" })).toThrow();
  });
});
