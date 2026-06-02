import { expect, test } from "@playwright/test";

test("renders publication-centric catalog view by default", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "GMDB" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Browse guitar magazines and song books",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Publications" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("switches to song-centric catalog view", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Songs" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Find songs and their available transcriptions",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Songs" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
