import { test, expect } from "@playwright/test";

test("landing page loads with correct title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PhDRadar/);
});

test("landing page has hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Find your PhD advisor")).toBeVisible();
  await expect(page.getByText("before you apply")).toBeVisible();
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
