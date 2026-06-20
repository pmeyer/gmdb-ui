import { graphql, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import { server } from "../../test/server";
import { AddPublicationView } from "./AddPublicationView";

interface GetPubIndicesVariables {
  pubType?: string;
}

interface GetPubsForIndexVariables {
  pubIndexId: number;
}

interface AddMagazineIssueVariables {
  magInput: {
    pubDate?: string;
    index: {
      id?: number;
      data?: {
        name: string;
        serial: string;
        type: string;
      };
    };
    info: {
      volume?: string;
      issue?: string;
      issueName: string;
      cover?: unknown;
    };
    pubId?: number;
    transcriptions?: unknown[];
  };
}

interface AddBookEditionVariables {
  bookInput: {
    pubDate?: string;
    index: {
      id?: number;
      data?: {
        name: string;
        serial: string;
        type: string;
      };
    };
    info: {
      edition: string;
      cover?: unknown;
    };
    pubId?: number;
    transcriptions?: unknown[];
  };
}

function publicationIndexLookupHandler(
  onRequest?: (variables: GetPubIndicesVariables) => void,
) {
  return graphql.query("GetPubIndices", ({ variables }) => {
    const typedVariables = variables as GetPubIndicesVariables;
    onRequest?.(typedVariables);

    const publicationIndices = [
      {
        __typename: "PubIndexResult",
        id: 11,
        name: "Guitar World",
        type: "MAG",
        serialNumber: "10456295",
      },
      {
        __typename: "PubIndexResult",
        id: 12,
        name: "Collected Rock Tabs",
        type: "BOOK",
        serialNumber: "0898987660",
      },
    ];

    return HttpResponse.json({
      data: {
        getPubIndices: publicationIndices.filter(
          ({ type }) =>
            typedVariables.pubType === undefined ||
            type === typedVariables.pubType,
        ),
      },
    });
  });
}

function publicationInstanceLookupHandler() {
  return graphql.query("GetPubsForIndex", ({ variables }) => {
    const { pubIndexId } = variables as GetPubsForIndexVariables;
    const publications = pubIndexId === 11
      ? [
          {
            __typename: "PubSearchResult",
            id: 1,
            pubDate: "1992-06-01",
            details: {
              __typename: "MagDetails",
              cover: null,
              issueName: "Summer Songs",
              volume: "12",
              issue: "4",
            },
          },
        ]
      : [
          {
            __typename: "PubSearchResult",
            id: 2,
            pubDate: "1989-01-15",
            details: {
              __typename: "BookDetails",
              cover: null,
              edition: "First edition",
            },
          },
        ];

    return HttpResponse.json({ data: { pubSearch: publications } });
  });
}

function addMagazineIssueHandler(
  onRequest: (variables: AddMagazineIssueVariables) => void,
) {
  return graphql.mutation("AddMagazineIssue", ({ variables }) => {
    onRequest(variables as AddMagazineIssueVariables);

    return HttpResponse.json({
      data: {
        addMagazineIssue: {
          __typename: "PubSearchResult",
          id: 101,
          name: "Guitar World",
          type: "MAG",
          pubDate: "2026-06-01",
          serialNumber: "10456295",
          pubIndexId: 11,
          details: {
            __typename: "MagDetails",
            cover: null,
            volume: "50",
            issue: "6",
            issueName: "Summer Songs",
          },
          transcriptions: [],
        },
      },
    });
  });
}

function addBookEditionHandler(
  onRequest: (variables: AddBookEditionVariables) => void,
) {
  return graphql.mutation("AddBookEdition", ({ variables }) => {
    onRequest(variables as AddBookEditionVariables);

    return HttpResponse.json({
      data: {
        addBookEdition: {
          __typename: "PubSearchResult",
          id: 202,
          name: "Collected Rock Tabs",
          type: "BOOK",
          pubDate: "1989-01-15",
          serialNumber: "0898987660",
          pubIndexId: 12,
          details: {
            __typename: "BookDetails",
            cover: null,
            edition: "First edition",
          },
          transcriptions: [],
        },
      },
    });
  });
}

async function chooseExistingMagazine() {
  const user = userEvent.setup();

  await user.click(await screen.findByRole("combobox", { name: "Publication" }));
  await user.click(
    await screen.findByRole("option", { name: /Guitar World/ }),
  );

  return user;
}

async function chooseNewPublication(name: string) {
  const user = userEvent.setup();
  const input = await screen.findByRole("combobox", { name: "Publication" });

  await user.type(input, name);
  await user.click(
    await screen.findByRole("option", { name: `Add "${name}"` }),
  );

  return user;
}

describe("AddPublicationView", () => {
  beforeEach(() => {
    server.use(publicationInstanceLookupHandler());
  });
  it("renders magazine issue fields by default and looks up existing magazines", async () => {
    const requests: GetPubIndicesVariables[] = [];
    server.use(
      publicationIndexLookupHandler((variables) => {
        requests.push(variables);
      }),
    );

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Add publication" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Magazine issue" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await screen.findByRole("combobox", { name: "Publication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Serial number (ISSN)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Volume" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Issue" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Issue Name" })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        requests.some((request) => request.pubType === "MAG"),
      ).toBe(true);
    });
  });

  it("switches to the new book edition path", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Book edition" }));

    expect(screen.getByRole("combobox", { name: "Publication" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Serial number (ISBN)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Edition" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Volume" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Issue Name" }),
    ).not.toBeInTheDocument();
  });

  it("validates required magazine identity and issue fields", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save publication" }));

    expect(await screen.findByText("Magazine name is required.")).toBeInTheDocument();
    expect(screen.getByText("Serial number is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Issue name is required for magazine issues."),
    ).toBeInTheDocument();
  });

  it("validates required book identity and edition fields", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Book edition" }));
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    expect(await screen.findByText("Book title is required.")).toBeInTheDocument();
    expect(screen.getByText("Serial number is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Edition is required for book editions."),
    ).toBeInTheDocument();
  });

  it("requires serial number for a typed new publication identity", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await chooseNewPublication("New Guitar Magazine");
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    expect(await screen.findByText("Serial number is required.")).toBeInTheDocument();
  });

  it("submits a magazine issue through the GraphQL mutation", async () => {
    const onSaved = vi.fn();
    const mutationRequests: AddMagazineIssueVariables[] = [];
    server.use(
      publicationIndexLookupHandler(),
      addMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={onSaved} />);

    const user = await chooseExistingMagazine();
    expect(screen.getByRole("textbox", { name: "Serial number (ISSN)" })).toBeDisabled();
    const issueNameInput = await screen.findByRole("combobox", {
      name: "Issue Name",
    });
    await user.click(issueNameInput);
    await user.click(await screen.findByRole("option", { name: /Summer Songs/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Volume" }), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue" }), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText("Publication date"), {
      target: { value: "2026-06-01" },
    });
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("101");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        pubDate: "2026-06-01",
        index: {
          id: 11,
        },
        info: {
          volume: "50",
          issue: "6",
          issueName: "Summer Songs",
        },
        transcriptions: [],
      },
    });
    expect(mutationRequests[0].magInput.pubId).toBe(1);
  });

  it("submits a typed new magazine identity with a custom serial number", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: AddMagazineIssueVariables[] = [];
    server.use(
      publicationIndexLookupHandler(),
      addMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={onSaved} />);

    await chooseNewPublication("New Guitar Magazine");
    const serialInput = screen.getByRole("textbox", { name: "Serial number (ISSN)" });
    fireEvent.change(serialInput, {
      target: { value: "SELF-PUB-001" },
    });
    expect(serialInput).toHaveValue("SELF-PUB-001");
    fireEvent.change(screen.getByRole("textbox", { name: "Issue Name" }), {
      target: { value: "Launch Issue" },
    });
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("101");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        index: {
          data: {
            name: "New Guitar Magazine",
            serial: "SELF-PUB-001",
            type: "MAG",
          },
        },
      },
    });
    expect(mutationRequests[0].magInput.pubId).toBeUndefined();
  });

  it("formats a recognized ISSN for a typed new magazine identity", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: AddMagazineIssueVariables[] = [];
    server.use(
      publicationIndexLookupHandler(),
      addMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={onSaved} />);

    await chooseNewPublication("New Guitar Magazine");
    const serialInput = screen.getByRole("textbox", { name: "Serial number (ISSN)" });
    fireEvent.change(serialInput, {
      target: { value: "10456295" },
    });
    expect(serialInput).toHaveValue("1045-6295");
    expect(screen.getByText("ISSN")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Issue Name" }), {
      target: { value: "Launch Issue" },
    });
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("101");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        index: {
          data: {
            name: "New Guitar Magazine",
            serial: "1045-6295",
            type: "MAG",
          },
        },
      },
    });
  });

  it("submits a book edition with required edition metadata", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: AddBookEditionVariables[] = [];
    server.use(
      publicationIndexLookupHandler(),
      addBookEditionHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={onSaved} />);

    await user.click(screen.getByRole("button", { name: "Book edition" }));
    await user.click(await screen.findByRole("combobox", { name: "Publication" }));
    await user.click(
      await screen.findByRole("option", {
        name: /Collected Rock Tabs/,
      }),
    );
    const editionInput = await screen.findByRole("combobox", { name: "Edition" });
    await user.type(editionInput, "Revised edition");
    await user.click(
      await screen.findByRole("option", { name: 'Add "Revised edition"' }),
    );
    fireEvent.change(screen.getByLabelText("Publication date"), {
      target: { value: "1989-01-15" },
    });
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("202");
    });
    expect(mutationRequests[0]).toMatchObject({
      bookInput: {
        pubDate: "1989-01-15",
        index: {
          id: 12,
        },
        info: {
          edition: "Revised edition",
        },
        transcriptions: [],
      },
    });
    expect(mutationRequests[0].bookInput.pubId).toBeUndefined();
  });
});
