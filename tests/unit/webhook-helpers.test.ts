describe("Stripe price -> plan mapping", () => {
  const originalPro = process.env.STRIPE_PRICE_PRO;
  const originalPremium = process.env.STRIPE_PRICE_PREMIUM;

  beforeEach(() => {
    process.env.STRIPE_PRICE_PRO = "price_pro_test";
    process.env.STRIPE_PRICE_PREMIUM = "price_premium_test";
  });

  afterEach(() => {
    if (originalPro === undefined) delete process.env.STRIPE_PRICE_PRO;
    else process.env.STRIPE_PRICE_PRO = originalPro;
    if (originalPremium === undefined) delete process.env.STRIPE_PRICE_PREMIUM;
    else process.env.STRIPE_PRICE_PREMIUM = originalPremium;
  });

  it("matches the PRO price id", () => {
    expect(process.env.STRIPE_PRICE_PRO).toBe("price_pro_test");
  });

  it("matches the PREMIUM price id", () => {
    expect(process.env.STRIPE_PRICE_PREMIUM).toBe("price_premium_test");
  });
});
