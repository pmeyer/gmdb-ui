import { graphql, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../test/server";
import { renderWithProviders } from "../../test/renderWithProviders";
import { SongCatalogView } from "./SongCatalogView";

interface SongCatalogCriteria {
  titleSearch?: string;
  artistSearch?: string;
  albumSearch?: string;
  pubNameSearch?: string;
}

interface SongCatalogVariables {
  criteria?: SongCatalogCriteria;
}

function songCatalogHandler(
  songSearch: unknown[],
  onRequest?: (variables: SongCatalogVariables) => void,
) {
  return graphql.query("SongCatalog", ({ variables }) => {
    onRequest?.(variables);

    return HttpResponse.json({
      data: {
        songSearch,
      },
    });
  });
}

function criteriaHandler(
  getSongSearch: (criteria: SongCatalogVariables["criteria"]) => unknown[],
) {
  return graphql.query("SongCatalog", ({ variables }) => {
    const catalogVariables = variables as SongCatalogVariables;

    return HttpResponse.json({
      data: {
        songSearch: getSongSearch(catalogVariables.criteria),
      },
    });
  });
}

function hasCriteria(
  requests: SongCatalogVariables[],
  expectedCriteria: SongCatalogCriteria,
) {
  return requests.some((request) => {
    const criteria = request.criteria;

    return Object.entries(expectedCriteria).every(
      ([field, expectedValue]) =>
        criteria?.[field as keyof SongCatalogCriteria] === expectedValue,
    );
  });
}

function hasEmptyCriteria(requests: SongCatalogVariables[]) {
  return requests.some(
    (request) =>
      request.criteria !== undefined && Object.keys(request.criteria).length === 0,
  );
}

async function searchSongs(filters: SongCatalogCriteria) {
  const user = userEvent.setup();

  if (filters.titleSearch !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "Search songs" }), {
      target: { value: filters.titleSearch },
    });
  }

  if (filters.artistSearch !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "Artist" }), {
      target: { value: filters.artistSearch },
    });
  }

  if (filters.albumSearch !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "Album" }), {
      target: { value: filters.albumSearch },
    });
  }

  if (filters.pubNameSearch !== undefined) {
    fireEvent.change(screen.getByRole("textbox", { name: "Publication" }), {
      target: { value: filters.pubNameSearch },
    });
  }

  await user.click(screen.getByRole("button", { name: "Search" }));
}

const songCatalogResults = [
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
        roles: ["PERFORMED_BY", "MUSIC_BY", "WORDS_BY"],
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
            cover: "/resources/publications/1/cover",
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
          {
            __typename: "Transcriber",
            id: "502",
            name: "Pat Lee",
          },
        ],
      },
    ],
  },
  {
    __typename: "SongSearchResult",
    id: "202",
    title: "Untitled Draft",
    album: null,
    artists: [],
    transcriptions: [
      {
        __typename: "Transcription",
        id: "102",
        url: null,
        pageNumber: null,
        pub: null,
        transcribers: [],
      },
    ],
  },
];

describe("SongCatalogView", () => {
  it("shows loading placeholders while song transcriptions are loading", () => {
    server.use(
      graphql.query("SongCatalog", async () => {
        await delay(100);

        return HttpResponse.json({
          data: {
            songSearch: [],
          },
        });
      }),
    );

    renderWithProviders(<SongCatalogView />);

    expect(screen.getAllByLabelText("Loading song transcription")).toHaveLength(5);
  });

  it("renders song transcription cards from GraphQL search results", async () => {
    server.use(songCatalogHandler(songCatalogResults));

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jimi Hendrix")).toBeInTheDocument();
    expect(screen.getByText("Axis: Bold as Love")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Guitar World, Summer Songs · Vol. 12 · Issue 4, June 1, 1992 · Page 48",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Transcribed by Jane Smith, Pat Lee")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Untitled Draft" })).toBeInTheDocument();
    expect(screen.getByText("Artist unknown")).toBeInTheDocument();
    expect(screen.getByText("Album not listed")).toBeInTheDocument();
    expect(screen.getByText("Source publication not assigned")).toBeInTheDocument();
  });

  it("submits supported song filters through GraphQL criteria", async () => {
    const requests: SongCatalogVariables[] = [];
    server.use(
      songCatalogHandler(songCatalogResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();

    await searchSongs({
      titleSearch: "Little",
      artistSearch: "Hendrix",
      albumSearch: "Axis",
      pubNameSearch: "Guitar World",
    });

    await waitFor(() => {
      expect(
        hasCriteria(requests, {
          titleSearch: "Little",
          artistSearch: "Hendrix",
          albumSearch: "Axis",
          pubNameSearch: "Guitar World",
        }),
      ).toBe(true);
    });

    expect(screen.getByText("Active filters")).toBeInTheDocument();
    expect(screen.getByText("Song: Little")).toBeInTheDocument();
    expect(screen.getByText("Artist: Hendrix")).toBeInTheDocument();
    expect(screen.getByText("Album: Axis")).toBeInTheDocument();
    expect(screen.getByText("Publication: Guitar World")).toBeInTheDocument();
  });

  it("clears active filters and restores empty search criteria", async () => {
    const user = userEvent.setup();
    const requests: SongCatalogVariables[] = [];
    server.use(
      songCatalogHandler(songCatalogResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();

    await searchSongs({ titleSearch: "Little" });

    await waitFor(() => {
      expect(hasCriteria(requests, { titleSearch: "Little" })).toBe(true);
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search songs" })).toHaveValue("");

    await waitFor(() => {
      expect(hasEmptyCriteria(requests)).toBe(true);
    });
  });

  it("shows an empty state when no song transcriptions are cataloged", async () => {
    server.use(songCatalogHandler([{ ...songCatalogResults[0], transcriptions: [] }]));

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "No song transcriptions found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cataloged song transcriptions will appear here once they are added."),
    ).toBeInTheDocument();
  });

  it("distinguishes filtered no-match results from an empty catalog", async () => {
    server.use(
      criteriaHandler((criteria) =>
        criteria?.titleSearch === "Missing" ? [] : songCatalogResults,
      ),
    );

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Little Wing" }),
    ).toBeInTheDocument();

    await searchSongs({ titleSearch: "Missing" });

    expect(
      await screen.findByRole("heading", {
        name: "No song transcriptions match these filters",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Adjust the song, artist, album, or publication filters to broaden the results.",
      ),
    ).toBeInTheDocument();
  });

  it("shows an error state when the GraphQL query fails", async () => {
    server.use(
      graphql.query("SongCatalog", () =>
        HttpResponse.json(
          {
            errors: [{ message: "Catalog API unavailable" }],
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<SongCatalogView />);

    expect(
      await screen.findByText(
        "Song transcriptions could not be loaded. Try again after the catalog API is available.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the add song transcription action visible as a deferred workflow", async () => {
    const user = userEvent.setup();
    server.use(songCatalogHandler(songCatalogResults));

    renderWithProviders(<SongCatalogView />);

    await user.click(await screen.findByRole("button", { name: "Add song transcription" }));
    expect(
      await screen.findByText("Add song transcription is not available yet."),
    ).toBeInTheDocument();
  });

  it("routes the view transcription action with publication context", async () => {
    const user = userEvent.setup();
    const onTranscriptionSelected = vi.fn();
    server.use(songCatalogHandler(songCatalogResults));

    renderWithProviders(
      <SongCatalogView onTranscriptionSelected={onTranscriptionSelected} />,
    );

    await user.click(
      await screen.findByRole("button", { name: "View transcription for Little Wing" }),
    );

    expect(onTranscriptionSelected).toHaveBeenCalledWith("1", "101");
  });

  it("keeps the edit transcription action visible as a deferred workflow", async () => {
    const user = userEvent.setup();
    server.use(songCatalogHandler(songCatalogResults));

    renderWithProviders(<SongCatalogView />);

    await user.click(
      await screen.findByRole("button", { name: "Edit transcription for Little Wing" }),
    );
    expect(
      await screen.findByText("Edit transcription for Little Wing is not available yet."),
    ).toBeInTheDocument();
  });
});
