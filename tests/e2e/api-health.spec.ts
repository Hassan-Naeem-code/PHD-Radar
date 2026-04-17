import { test, expect } from "@playwright/test";

test("health endpoint returns ok with DB connected", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.success).toBe(true);
  expect(json.data.status).toBe("ok");
  expect(json.data.db).toBe("connected");
});

test("auth providers endpoint lists google + credentials", async ({ request }) => {
  const res = await request.get("/api/auth/providers");
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json).toHaveProperty("google");
  expect(json).toHaveProperty("credentials");
});

test("unauthenticated /api/profile returns 401", async ({ request }) => {
  const res = await request.get("/api/profile");
  expect(res.status()).toBe(401);
});

test("unauthenticated /api/search/professors returns 401", async ({ request }) => {
  const res = await request.get("/api/search/professors?query=AI");
  expect(res.status()).toBe(401);
});

test("password-reset request accepts unknown email silently (no enumeration)", async ({ request }) => {
  const res = await request.post("/api/auth/password-reset/request", {
    data: { email: "nobody-exists-here@phdradar.test" },
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.success).toBe(true);
  expect(json.data.sent).toBe(true);
});
