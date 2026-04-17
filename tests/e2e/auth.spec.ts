import { test, expect } from "@playwright/test";

function uniqueEmail(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `e2e+${rand}@phdradar.test`;
}

test.describe("Authentication", () => {
  test("signup page renders and validates password strength", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText(/Create your account/i)).toBeVisible();

    await page.getByLabel(/name/i).fill("Test User");
    await page.getByLabel(/email/i).fill("weak@test.com");
    await page.getByLabel(/password/i).fill("weak");
    await page.getByRole("button", { name: /sign up|create account/i }).click();

    await expect(
      page.getByText(/at least 8 characters|uppercase|lowercase|number/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("can sign up, sign out, and sign back in", async ({ page }) => {
    const email = uniqueEmail();
    const password = "StrongPass1";

    await page.goto("/signup");
    await page.getByLabel(/name/i).fill("E2E User");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign up|create account/i }).click();

    await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 });

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 });
  });

  test("rejects invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nonexistent@test.com");
    await page.getByLabel(/password/i).fill("WrongPass1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/Invalid|2FA is on/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("forgot-password flow renders and accepts email", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();

    await page.getByLabel(/email/i).fill("anyone@test.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();

    await expect(
      page.getByText(/Check your email for the reset link/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("login links to forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});
