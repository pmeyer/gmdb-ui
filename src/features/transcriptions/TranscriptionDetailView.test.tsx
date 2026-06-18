import { graphql, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../test/server";
import { renderWithProviders } from "../../test/renderWithProviders";
import { TranscriptionDetailView } from "./TranscriptionDetailView";

interface TranscriptionDetailVariables {
  publicationId?: number;
}

interface PublicationWithId {
  id: unknown;
}

function isPublicationWithId(value: unknown): value is PublicationWithId {
  return typeof value === "object" && value !== null && "id" in value;
}

function comparableId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return value.toString();
  }

  return undefined;
}

function transcriptionDetailHandler(
  pubSearch: unknown[],
  onRequest?: (variables: TranscriptionDetailVariables) => void,
) {
  return graphql.query("TranscriptionDetailCatalog", ({ variables }) => {
    const detailVariables = variables as TranscriptionDetailVariables;
    const criteriaId = comparableId(detailVariables.publicationId);
    const filteredPubSearch =
      criteriaId === undefined
        ? pubSearch
        : pubSearch.filter(
            (publication) =>
              isPublicationWithId(publication) &&
              comparableId(publication.id) === criteriaId,
          );

    onRequest?.(detailVariables);

    return HttpResponse.json({
      data: {
        pubSearch: filteredPubSearch,
      },
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
          {
            __typename: "Transcriber",
            id: "502",
            name: "Pat Lee",
          },
        ],
      },
      {
        __typename: "PubTranscription",
        id: "102",
        url: null,
        pageNumber: null,
        song: {
          __typename: "Song",
          id: "202",
          title: "Untitled Draft",
          album: null,
          artists: [],
        },
        transcribers: [],
      },
    ],
  },
  {
    __typename: "PubSearchResult",
    id: "2",
    name: "Collected Rock Tabs",
    type: "BOOK",
    pubDate: null,
    serialNumber: "ISBN 978-1-2345-6789-0",
    pubIndexId: "12",
    details: {
      __typename: "BookDetails",
      cover: null,
      edition: "First edition",
    },
    transcriptions: [
      {
        __typename: "PubTranscription",
        id: "201",
        url: "/resources/transcriptions/201/file",
        pageNumber: 14,
        song: {
          __typename: "Song",
          id: "301",
          title: "Missing Artwork Blues",
          album: {
            __typename: "SongAlbum",
            id: "401",
            title: "No Cover Sessions",
            trackNumber: null,
            releaseDate: null,
            albumArtUrl: null,
            artist: null,
          },
          artists: [],
        },
        transcribers: [],
      },
    ],
  },
];

describe("TranscriptionDetailView", () => {
  it("shows loading placeholders while transcription details are loading", () => {
    server.use(
      graphql.query("TranscriptionDetailCatalog", async () => {
        await delay(100);

        return HttpResponse.json({
          data: {
            pubSearch: [],
          },
        });
      }),
    );

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="101"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Loading transcription details")).toBeInTheDocument();
  });

  it("renders transcription metadata and an embedded PDF viewer from GraphQL", async () => {
    const requests: TranscriptionDetailVariables[] = [];
    server.use(
      transcriptionDetailHandler(publicationResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="101"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        "Guitar World, Summer Songs · Vol. 12 · Issue 4, June 1, 1992",
      ),
    ).toHaveLength(2);
    expect(screen.getByText("Page 48")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("Axis: Bold as Love")).toBeInTheDocument();
    expect(screen.getByText("The Jimi Hendrix Experience")).toBeInTheDocument();
    expect(screen.getByText("Performed by")).toBeInTheDocument();
    expect(screen.getByText("Music by")).toBeInTheDocument();
    expect(screen.getByText("Words by")).toBeInTheDocument();
    expect(screen.getAllByText("Jimi Hendrix")).toHaveLength(3);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Pat Lee")).toBeInTheDocument();
    expect(screen.getByTitle("PDF viewer for Little Wing")).toHaveAttribute(
      "src",
      "/resources/transcriptions/101/file",
    );
    expect(requests).toContainEqual({
      publicationId: 1,
    });
  });

  it("shows a polished placeholder when no PDF reference is available", async () => {
    server.use(transcriptionDetailHandler(publicationResults));

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="102"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Untitled Draft" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "PDF not available" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This transcription has catalog metadata, but no PDF file reference is available yet.",
      ),
    ).toBeInTheDocument();
  });

  it("uses catalog artwork placeholders when transcription source images are missing", async () => {
    server.use(transcriptionDetailHandler(publicationResults));

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="2"
        transcriptionId="201"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Missing Artwork Blues" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Cover art for Collected Rock Tabs, First edition",
      }),
    ).toHaveAttribute("src", expect.stringContaining("cover-img-placeholder.png"));
    expect(
      screen.getByRole("img", { name: "Album art for No Cover Sessions" }),
    ).toHaveAttribute("src", expect.stringContaining("album-art-placeholder.png"));
  });

  it("shows a not-found state when the routed transcription is absent", async () => {
    server.use(transcriptionDetailHandler(publicationResults));

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="missing"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Transcription not found" }),
    ).toBeInTheDocument();
  });

  it("shows an error state when the detail query fails", async () => {
    server.use(
      graphql.query("TranscriptionDetailCatalog", () =>
        HttpResponse.json(
          {
            errors: [{ message: "Catalog API unavailable" }],
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="101"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        "Transcription details could not be loaded. Try again after the catalog API is available.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the edit transcription action visible as a deferred workflow", async () => {
    const user = userEvent.setup();
    server.use(transcriptionDetailHandler(publicationResults));

    renderWithProviders(
      <TranscriptionDetailView
        publicationId="1"
        transcriptionId="101"
        backLabel="Back to publication"
        onBack={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Edit transcription" }));

    expect(
      await screen.findByText("Edit transcription is not available yet."),
    ).toBeInTheDocument();
  });
});
