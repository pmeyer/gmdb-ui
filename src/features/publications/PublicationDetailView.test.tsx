import { graphql, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../test/server";
import { renderWithProviders } from "../../test/renderWithProviders";
import { PublicationDetailView } from "./PublicationDetailView";

interface PublicationDetailVariables {
  id?: unknown;
}

interface PublicationWithId {
  id: unknown;
}

function isPublicationWithId(value: unknown): value is PublicationWithId {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value
  );
}

function comparableId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return value.toString();
  }

  return undefined;
}

function publicationDetailHandler(
  pubSearch: unknown[],
  onRequest?: (variables: PublicationDetailVariables) => void,
) {
  return graphql.query("PublicationDetailCatalog", ({ variables }) => {
    const detailVariables = variables as PublicationDetailVariables;
    const criteriaId = comparableId(detailVariables.id);
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

const publicationDetailResults = [
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
        pageNumber: 48,
        song: {
          __typename: "Song",
          id: "201",
          title: "Little Wing",
        },
      },
      {
        __typename: "PubTranscription",
        id: "102",
        pageNumber: 62,
        song: {
          __typename: "Song",
          id: "202",
          title: "Barracuda",
        },
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
    transcriptions: [],
  },
];

describe("PublicationDetailView", () => {
  it("shows loading placeholders while publication details are loading", () => {
    server.use(
      graphql.query("PublicationDetailCatalog", async () => {
        await delay(100);

        return HttpResponse.json({
          data: {
            pubSearch: [],
          },
        });
      }),
    );

    renderWithProviders(
      <PublicationDetailView
        publicationId="1"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Loading publication details")).toBeInTheDocument();
  });

  it("renders publication metadata and song transcriptions from GraphQL", async () => {
    const requests: PublicationDetailVariables[] = [];
    server.use(
      publicationDetailHandler(publicationDetailResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(
      <PublicationDetailView
        publicationId="1"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Guitar World" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Magazine issue")).toBeInTheDocument();
    expect(screen.getAllByText("ISSN 1045-6295")).toHaveLength(2);
    expect(screen.getByText("Volume")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Issue")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Issue name")).toBeInTheDocument();
    expect(screen.getByText("Summer Songs")).toBeInTheDocument();
    expect(screen.getByText("Publication date")).toBeInTheDocument();
    expect(screen.getByText("June 1, 1992")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Song transcriptions" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Little Wing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Barracuda" })).toBeInTheDocument();
    expect(screen.getByText("Guitar World, June 1, 1992 · Page 48")).toBeInTheDocument();
    expect(screen.getByText("Guitar World, June 1, 1992 · Page 62")).toBeInTheDocument();
    expect(requests).toContainEqual({
      id: "1",
    });
  });

  it("shows an empty transcription state for publications without transcriptions", async () => {
    server.use(publicationDetailHandler(publicationDetailResults));

    renderWithProviders(
      <PublicationDetailView
        publicationId="2"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Collected Rock Tabs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No song transcriptions listed" }),
    ).toBeInTheDocument();
  });

  it("shows a not-found state when the routed publication is absent", async () => {
    server.use(publicationDetailHandler(publicationDetailResults));

    renderWithProviders(
      <PublicationDetailView
        publicationId="missing"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Publication not found" }),
    ).toBeInTheDocument();
  });

  it("shows an error state when the detail query fails", async () => {
    server.use(
      graphql.query("PublicationDetailCatalog", () =>
        HttpResponse.json(
          {
            errors: [{ message: "Catalog API unavailable" }],
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(
      <PublicationDetailView
        publicationId="1"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        "Publication details could not be loaded. Try again after the catalog API is available.",
      ),
    ).toBeInTheDocument();
  });

  it("routes the edit action through the supplied callback", async () => {
    const user = userEvent.setup();
    const onEditPublication = vi.fn();
    server.use(publicationDetailHandler(publicationDetailResults));

    renderWithProviders(
      <PublicationDetailView
        publicationId="1"
        onBackToPublications={vi.fn()}
        onEditPublication={onEditPublication}
        onTranscriptionSelected={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Edit publication" }));

    expect(onEditPublication).toHaveBeenCalledOnce();
  });

  it("routes transcription actions to the selected transcription", async () => {
    const user = userEvent.setup();
    const onTranscriptionSelected = vi.fn();
    server.use(publicationDetailHandler(publicationDetailResults));

    renderWithProviders(
      <PublicationDetailView
        publicationId="1"
        onBackToPublications={vi.fn()}
        onEditPublication={vi.fn()}
        onTranscriptionSelected={onTranscriptionSelected}
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "View transcription for Little Wing",
      }),
    );

    expect(onTranscriptionSelected).toHaveBeenCalledWith("101");
  });
});
