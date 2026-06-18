import { graphql, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { server } from "../../test/server";
import { renderWithProviders } from "../../test/renderWithProviders";
import { PublicationCatalogView } from "./PublicationCatalogView";

interface PublicationCatalogCriteria {
  searchName?: string;
  type?: string;
}

interface PublicationCatalogVariables {
  criteria?: PublicationCatalogCriteria;
}

function publicationCatalogHandler(
  pubSearch: unknown[],
  onRequest?: (variables: PublicationCatalogVariables) => void,
) {
  return graphql.query("PublicationCatalog", ({ variables }) => {
    onRequest?.(variables);

    return HttpResponse.json({
      data: {
        pubSearch,
      },
    });
  });
}

function criteriaHandler(
  getPubSearch: (criteria: PublicationCatalogVariables["criteria"]) => unknown[],
) {
  return graphql.query("PublicationCatalog", ({ variables }) => {
    const catalogVariables = variables as PublicationCatalogVariables;

    return HttpResponse.json({
      data: {
        pubSearch: getPubSearch(catalogVariables.criteria),
      },
    });
  });
}

function hasCriteria(
  requests: PublicationCatalogVariables[],
  expectedCriteria: PublicationCatalogCriteria,
) {
  return requests.some((request) => {
    const criteria = request.criteria;

    return Object.entries(expectedCriteria).every(
      ([field, expectedValue]) =>
        criteria?.[field as keyof PublicationCatalogCriteria] === expectedValue,
    );
  });
}

function hasEmptyCriteria(requests: PublicationCatalogVariables[]) {
  return requests.some(
    (request) =>
      request.criteria !== undefined && Object.keys(request.criteria).length === 0,
  );
}

async function selectPublicationType(typeName: string) {
  const user = userEvent.setup();

  await user.click(screen.getByRole("combobox", { name: "Type" }));
  await user.click(await screen.findByRole("option", { name: typeName }));
}

async function searchPublications(searchText: string) {
  const user = userEvent.setup();

  await user.clear(screen.getByRole("textbox", { name: "Search publications" }));
  await user.type(
    screen.getByRole("textbox", { name: "Search publications" }),
    searchText,
  );
  await user.click(screen.getByRole("button", { name: "Search" }));
}

const publicationCatalogResults = [
  {
    __typename: "PubSearchResult",
    id: 1,
    name: "Guitar World",
    type: "MAG",
    pubDate: "1992-06-01",
    serialNumber: "ISSN 1045-6295",
    pubIndexId: 11,
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
        id: 101,
        song: {
          __typename: "Song",
          id: 201,
          title: "Little Wing",
        },
      },
      {
        __typename: "PubTranscription",
        id: 102,
        song: {
          __typename: "Song",
          id: 202,
          title: "Barracuda",
        },
      },
    ],
  },
  {
    __typename: "PubSearchResult",
    id: 2,
    name: "Collected Rock Tabs",
    type: "BOOK",
    pubDate: "1989-01-15",
    serialNumber: "ISBN 978-1-2345-6789-0",
    pubIndexId: 12,
    details: {
      __typename: "BookDetails",
      cover: null,
      edition: "First edition",
    },
    transcriptions: [],
  },
];

describe("PublicationCatalogView", () => {
  it("shows loading placeholders while publications are loading", () => {
    server.use(
      graphql.query("PublicationCatalog", async () => {
        await delay(100);

        return HttpResponse.json({
          data: {
            pubSearch: [],
          },
        });
      }),
    );

    renderWithProviders(<PublicationCatalogView />);

    expect(screen.getAllByLabelText("Loading publication")).toHaveLength(8);
  });

  it("renders publication cards from GraphQL search results", async () => {
    server.use(publicationCatalogHandler(publicationCatalogResults));

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Guitar World" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Collected Rock Tabs" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Cover art for Collected Rock Tabs" }),
    ).toHaveAttribute("src", expect.stringContaining("cover-img-placeholder.png"));
    expect(screen.getByText("Magazine issue")).toBeInTheDocument();
    expect(screen.getByText("Book edition")).toBeInTheDocument();
    expect(
      screen.getByText("Vol. 12 · Issue 4 · Summer Songs · June 1, 1992"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Edition First edition · January 15, 1989"),
    ).toBeInTheDocument();
    expect(screen.getByText("Includes Little Wing, Barracuda")).toBeInTheDocument();
    expect(screen.getByText("0 transcriptions")).toBeInTheDocument();
  });

  it("shows an empty state when no publications match", async () => {
    server.use(publicationCatalogHandler([]));

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "No publications found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cataloged magazines and books will appear here once they are added."),
    ).toBeInTheDocument();
  });

  it("submits supported publication filters through GraphQL criteria", async () => {
    const user = userEvent.setup();
    const requests: PublicationCatalogVariables[] = [];
    server.use(
      publicationCatalogHandler(publicationCatalogResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Guitar World" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Search publications" }),
      "Collected",
    );
    await user.click(screen.getByRole("combobox", { name: "Type" }));
    await user.click(await screen.findByRole("option", { name: "Books" }));
    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(
        hasCriteria(requests, {
          searchName: "Collected",
          type: "BOOK",
        }),
      ).toBe(true);
    });

    expect(screen.getByText("Active filters")).toBeInTheDocument();
    expect(screen.getByText("Search: Collected")).toBeInTheDocument();
    expect(screen.getByText("Type: Books")).toBeInTheDocument();
  });

  it("clears active filters and restores empty search criteria", async () => {
    const user = userEvent.setup();
    const requests: PublicationCatalogVariables[] = [];
    server.use(
      publicationCatalogHandler(publicationCatalogResults, (variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Guitar World" }),
    ).toBeInTheDocument();

    await selectPublicationType("Magazines");
    await searchPublications("Guitar World");

    await waitFor(() => {
      expect(
        hasCriteria(requests, {
          searchName: "Guitar World",
          type: "MAG",
        }),
      ).toBe(true);
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.queryByText("Active filters")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search publications" })).toHaveValue("");

    await waitFor(() => {
      expect(hasEmptyCriteria(requests)).toBe(true);
    });
  });

  it("distinguishes filtered no-match results from an empty catalog", async () => {
    server.use(
      criteriaHandler((criteria) =>
        criteria?.searchName === "Missing" ? [] : publicationCatalogResults,
      ),
    );

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByRole("heading", { name: "Guitar World" }),
    ).toBeInTheDocument();

    await searchPublications("Missing");

    expect(
      await screen.findByRole("heading", {
        name: "No publications match these filters",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Adjust the search or publication type filter to broaden the results."),
    ).toBeInTheDocument();
  });

  it("shows an error state when the GraphQL query fails", async () => {
    server.use(
      graphql.query("PublicationCatalog", () =>
        HttpResponse.json(
          {
            errors: [{ message: "Catalog API unavailable" }],
          },
          { status: 500 },
        ),
      ),
    );

    renderWithProviders(<PublicationCatalogView />);

    expect(
      await screen.findByText(
        "Publications could not be loaded. Try again after the catalog API is available.",
      ),
    ).toBeInTheDocument();
  });

  it("uses the add publication action callback when provided", async () => {
    const user = userEvent.setup();
    const onAddPublication = vi.fn();
    server.use(publicationCatalogHandler([]));

    renderWithProviders(<PublicationCatalogView onAddPublication={onAddPublication} />);

    await user.click(screen.getByRole("button", { name: "Add publication" }));

    expect(onAddPublication).toHaveBeenCalledOnce();
  });

  it("uses the edit publication action callback when provided", async () => {
    const user = userEvent.setup();
    const onPublicationEditSelected = vi.fn();
    server.use(publicationCatalogHandler(publicationCatalogResults));

    renderWithProviders(
      <PublicationCatalogView
        onPublicationEditSelected={onPublicationEditSelected}
        onPublicationSelected={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Edit Guitar World" }));

    expect(onPublicationEditSelected).toHaveBeenCalledWith("1");
  });
});
