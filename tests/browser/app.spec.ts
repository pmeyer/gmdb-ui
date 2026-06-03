import { expect, test, type Page } from "@playwright/test";

async function routePublicationCatalog(page: Page) {
  await page.route("**/graphql", async (route) => {
    const requestBody = route.request().postDataJSON() as {
      operationName?: string;
    };
    const data =
      requestBody.operationName === "SongCatalog"
        ? { songSearch: songResults }
        : { pubSearch: publicationResults };

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data,
      }),
    });
  });
}

const publicationResults = [
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
];

const songResults = [
  {
    __typename: "SongSearchResult",
    id: "201",
    title: "Little Wing",
    album: {
      __typename: "SongAlbum",
      id: "301",
      title: "Axis: Bold as Love",
      trackNumber: 6,
      releaseDate: "1967-12-01",
      albumArtUrl: null,
      artist: {
        __typename: "Artist",
        id: "401",
        name: "The Jimi Hendrix Experience",
        type: "BAND",
      },
    },
    artists: [
      {
        __typename: "SongArtist",
        id: "402",
        name: "Jimi Hendrix",
        type: "PERSON",
        roles: ["PERFORMED_BY"],
      },
    ],
    transcriptions: [
      {
        __typename: "Transcription",
        id: "101",
        url: "/resources/transcriptions/101/file",
        pageNumber: 48,
        pub: {
          __typename: "TranscriptionPub",
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
        },
        transcribers: [
          {
            __typename: "Transcriber",
            id: "501",
            name: "Jane Smith",
          },
        ],
      },
    ],
  },
];

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
      name: "Browse song transcriptions",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Little Wing" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add song transcription" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Songs" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
