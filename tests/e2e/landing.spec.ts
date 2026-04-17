import { test, expect } from "@playwright/test";

test("landing page loads with correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PhDRadar/);
});

test("landing page has hero section", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Find your PhD advisor before you apply/i })
  ).toBeVisible();
});

test("navigation links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get Started" }).first().click();
  await expect(page).toHaveURL(/signup/);
});

test("pricing page loads", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("Simple, transparent pricing")).toBeVisible();
});
