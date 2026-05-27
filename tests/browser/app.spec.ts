import { expect, test } from "@playwright/test";

test("renders the initial app content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Hello world")).toBeVisible();
});
