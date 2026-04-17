import { test, expect } from "@playwright/test";

const PROTECTED = [
  "/dashboard",
  "/discover",
  "/professors",
  "/outreach",
  "/applications",
  "/papers",
  "/profile",
  "/settings",
  "/admin",
];

test.describe("Protected routes redirect unauthenticated users", () => {
  for (const path of PROTECTED) {
    test(`${path} redirects to /login`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response).toBeTruthy();
      await expect(page).toHaveURL(/login/);
    });
  }
});

test.describe("Public routes accessible", () => {
  test("/login renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/Welcome back/i).first()).toBeVisible();
  });

  test("/signup renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("/pricing renders with all 3 plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText(/Free/).first()).toBeVisible();
    await expect(page.getByText(/Pro/).first()).toBeVisible();
    await expect(page.getByText(/Premium/).first()).toBeVisible();
  });

  test("/forgot-password renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Reset your password/i })).toBeVisible();
  });
});
