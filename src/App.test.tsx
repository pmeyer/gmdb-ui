import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import App from "./App";
import { server } from "./test/server";
import { renderWithProviders } from "./test/renderWithProviders";

function emptyPublicationCatalogHandler() {
  return graphql.query("PublicationCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: [],
      },
    }),
  );
}

function publicationCatalogHandler() {
  return graphql.query("PublicationCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: publicationResults,
      },
    }),
  );
}

function publicationIndexLookupHandler() {
  return graphql.query("AddPublicationIndexLookup", () =>
    HttpResponse.json({
      data: {
        getPubIndices: [
          {
            __typename: "PubIndexResult",
            id: "11",
            name: "Guitar World",
            type: "MAG",
            serialNumber: "10456295",
          },
        ],
      },
    }),
  );
}

function publicationDetailHandler() {
  return graphql.query("PublicationDetailCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: publicationResults,
      },
    }),
  );
}

function transcriptionDetailHandler() {
  return graphql.query("TranscriptionDetailCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: publicationResults,
      },
    }),
  );
}

function songCatalogHandler() {
  return graphql.query("SongCatalog", () =>
    HttpResponse.json({
      data: {
        songSearch: songResults,
      },
    }),
  );
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
      cover: "/resources/publications/1/cover",
      volume: "12",
      issue: "4",
      issueName: "Summer Songs",
    },
    transcriptions: [
      {
        __typename: "PubTranscription",
        id: "101",
        url: "/resources/transcriptions/101/file",
        pageNumber: 48,
        song: {
          __typename: "Song",
          id: "201",
          title: "Little Wing",
          album: {
            __typename: "SongAlbum",
            id: "301",
            title: "Axis: Bold as Love",
            trackNumber: 6,
            releaseDate: "1967-12-01",
            albumArtUrl: "/resources/albums/301/cover",
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
              roles: ["PERFORMED_BY", "MUSIC_BY", "WORDS_BY"],
            },
          ],
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
      albumArtUrl: "/resources/albums/301/cover",
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

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("lands on the publication-centric catalog view", async () => {
    server.use(emptyPublicationCatalogHandler());

    renderWithProviders(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Browse guitar magazines and song books",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Add publication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publications" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the add publication flow from the publication catalog", async () => {
    const user = userEvent.setup();
    server.use(emptyPublicationCatalogHandler(), publicationIndexLookupHandler());

    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", { name: "Add publication" }),
    );

    expect(window.location.pathname).toBe("/publications/add");
    expect(
      screen.getByRole("heading", { name: "Add publication" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("combobox", { name: "Existing magazine" }),
    ).toBeInTheDocument();
  });

  it("switches to the song-centric catalog view", async () => {
    const user = userEvent.setup();
    server.use(emptyPublicationCatalogHandler(), songCatalogHandler());

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: "Songs" }));

    expect(
      screen.getByRole("heading", {
        name: "Browse song transcriptions",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add song transcription" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Songs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("navigates from a publication card to publication details", async () => {
    const user = userEvent.setup();
    server.use(publicationCatalogHandler(), publicationDetailHandler());

    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", {
        name: "View details for Guitar World",
      }),
    );

    expect(window.location.pathname).toBe("/publications/1");
    expect(
      await screen.findByText("Table of contents for available guitar transcriptions"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Little Wing" })).toBeInTheDocument();
  });

  it("navigates from a publication transcription card to the transcription viewer", async () => {
    const user = userEvent.setup();
    server.use(
      publicationCatalogHandler(),
      publicationDetailHandler(),
      transcriptionDetailHandler(),
    );

    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", {
        name: "View details for Guitar World",
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "View transcription for Little Wing",
      }),
    );

    expect(window.location.pathname).toBe("/publications/1/transcriptions/101");
    expect(window.location.search).toBe("");
    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();
    expect(screen.getByTitle("PDF viewer for Little Wing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to publication" })).toBeInTheDocument();
  });

  it("navigates from a song transcription card to the transcription viewer", async () => {
    const user = userEvent.setup();
    server.use(emptyPublicationCatalogHandler(), songCatalogHandler(), transcriptionDetailHandler());

    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: "Songs" }));
    await user.click(
      await screen.findByRole("button", {
        name: "View transcription for Little Wing",
      }),
    );

    expect(window.location.pathname).toBe("/publications/1/transcriptions/101");
    expect(window.location.search).toBe("?from=songs");
    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to songs" })).toBeInTheDocument();
  });
});
