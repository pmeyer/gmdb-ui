import { expect, test, type Page } from "@playwright/test";

async function routePublicationCatalog(page: Page) {
  await page.route("**/graphql", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          pubSearch: [
            {
              __typename: "PubSearchResult",
              id: "1",
              name: "Guitar World",
              type: "MAG",
              pubDate: "1992-06-01",
              serialNumber: "ISSN 1045-6295",
              pubIndexId: "11",
              details: {
                __typename: "MagDetails",
                cover: null,
                volume: "12",
                issue: "4",
                issueName: "Summer Songs",
              },
              transcriptions: [
                {
                  __typename: "PubTranscription",
                  id: "101",
                  song: {
                    __typename: "Song",
                    id: "201",
                    title: "Little Wing",
                  },
                },
              ],
            },
          ],
        },
      }),
    });
  });
}

test("renders publication-centric catalog view by default", async ({ page }) => {
  await routePublicationCatalog(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "GMDB" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Browse guitar magazines and song books",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guitar World" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add publication" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Publications" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("switches to song-centric catalog view", async ({ page }) => {
  await routePublicationCatalog(page);
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
