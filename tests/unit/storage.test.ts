describe("storage", () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_KEY;

  afterEach(() => {
    jest.resetModules();
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_KEY;
    else process.env.SUPABASE_SERVICE_KEY = originalKey;
  });

  it("reports not configured when env vars are missing", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    jest.resetModules();
    const mod = await import("@/lib/storage");
    expect(mod.isSupabaseConfigured()).toBe(false);
  });

  it("reports configured when both env vars are present", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_KEY = "key";
    jest.resetModules();
    const mod = await import("@/lib/storage");
    expect(mod.isSupabaseConfigured()).toBe(true);
  });
});
