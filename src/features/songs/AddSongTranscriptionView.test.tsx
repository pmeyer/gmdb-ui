import { graphql, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import { server } from "../../test/server";
import { AddSongTranscriptionView } from "./AddSongTranscriptionView";

interface AddMagazineVariables {
  magInput: {
    index?: {
      data?: {
        name?: string;
        serial?: string;
      };
    };
    pubId?: unknown;
    transcriptions?: {
      pageNumber?: number;
      song?: {
        data?: {
          title?: string;
        };
      };
    }[];
  };
}

function lookupsHandler() {
  return graphql.query("AddSongTranscriptionLookups", () =>
    HttpResponse.json({
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
              cover: "/resources/publications/1/cover",
              volume: "12",
              issue: "4",
              issueName: "Summer Songs",
            },
          },
        ],
        songSearch: [
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
        ],
      },
    }),
  );
}

async function fillNewPublication(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "New publication" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Magazine name" }), {
    target: { value: "Guitar World" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Serial number (ISSN)" }), {
    target: { value: "ISSN 1045-6295" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Issue name" }), {
    target: { value: "Summer Songs" },
  });
}

async function advanceToSongStep(user: ReturnType<typeof userEvent.setup>) {
  await fillNewPublication(user);
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("AddSongTranscriptionView", () => {
  it("validates required fields before moving through steps", async () => {
    const user = userEvent.setup();
    server.use(lookupsHandler());

    renderWithProviders(
      <AddSongTranscriptionView onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Choose a publication before continuing."),
    ).toBeInTheDocument();

    await advanceToSongStep(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Song title is required for a new song."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Song title" }), {
      target: { value: "Barracuda" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Starting page number is required.")).toBeInTheDocument();
    expect(screen.getByText("Choose a transcription PDF before review.")).toBeInTheDocument();
  }, 20000);

  it("saves a new publication with a new song transcription", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationVariables: AddMagazineVariables[] = [];

    server.use(
      lookupsHandler(),
      graphql.mutation("AddSongTranscriptionMagazine", ({ variables }) => {
        mutationVariables.push(variables as AddMagazineVariables);

        return HttpResponse.json({
          data: {
            addMagazineIssue: {
              __typename: "PubSearchResult",
              id: "1",
              transcriptions: [
                {
                  __typename: "PubTranscription",
                  id: "900",
                  song: {
                    __typename: "Song",
                    id: "901",
                    title: "Barracuda",
                  },
                },
              ],
            },
          },
        });
      }),
    );

    renderWithProviders(
      <AddSongTranscriptionView onCancel={vi.fn()} onSaved={onSaved} />,
    );

    await advanceToSongStep(user);
    fireEvent.change(screen.getByRole("textbox", { name: "Song title" }), {
      target: { value: "Barracuda" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Starting page number" }), {
      target: { value: "42" },
    });
    await user.upload(
      screen.getByLabelText("Choose PDF"),
      new File(["pdf"], "barracuda.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Review and save" })).toBeInTheDocument();
    expect(screen.getByText("Magazine issue · Guitar World")).toBeInTheDocument();
    expect(screen.getByText("Barracuda")).toBeInTheDocument();
    expect(screen.getByText("Page 42 · barracuda.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save transcription" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("1");
    });

    expect(mutationVariables).toHaveLength(1);
    expect(mutationVariables[0].magInput.pubId).toBeUndefined();
    expect(mutationVariables[0].magInput.index?.data?.name).toBe("Guitar World");
    expect(mutationVariables[0].magInput.index?.data?.serial).toBe("ISSN 1045-6295");
    expect(mutationVariables[0].magInput.transcriptions?.[0]?.pageNumber).toBe(42);
    expect(
      mutationVariables[0].magInput.transcriptions?.[0]?.song?.data?.title,
    ).toBe("Barracuda");
  }, 20000);

  it("makes review sections easy to revisit", async () => {
    const user = userEvent.setup();
    server.use(lookupsHandler());

    renderWithProviders(
      <AddSongTranscriptionView onCancel={vi.fn()} onSaved={vi.fn()} />,
    );

    await advanceToSongStep(user);
    fireEvent.change(screen.getByRole("textbox", { name: "Song title" }), {
      target: { value: "Barracuda" },
    });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Starting page number" }), {
      target: { value: "42" },
    });
    await user.upload(
      screen.getByLabelText("Choose PDF"),
      new File(["pdf"], "barracuda.pdf", { type: "application/pdf" }),
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    const reviewActions = screen.getByText("Edit song").closest("div");

    expect(reviewActions).not.toBeNull();

    await user.click(within(reviewActions as HTMLElement).getByText("Edit song"));

    expect(screen.getByRole("textbox", { name: "Song title" })).toHaveValue("Barracuda");
  }, 20000);
  }, 20000);
