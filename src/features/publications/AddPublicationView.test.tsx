import { graphql, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import { server } from "../../test/server";
import { AddPublicationView } from "./AddPublicationView";

interface AddPublicationIndexLookupVariables {
  criteria?: {
    type?: string;
  };
}

interface AddMagazineIssueVariables {
  magInput: {
    pubDate?: string;
    index: {
      id?: string;
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
    pubId?: string;
    transcriptions?: unknown[];
  };
}

function publicationIndexLookupHandler(
  onRequest?: (variables: AddPublicationIndexLookupVariables) => void,
) {
  return graphql.query("AddPublicationIndexLookup", ({ variables }) => {
    onRequest?.(variables);

    return HttpResponse.json({
      data: {
        getPubIndices: [
          {
            __typename: "PubIndexResult",
            id: "11",
            name: "Guitar World",
            type: "MAG",
            serialNumber: "10456295",
          },
          {
            __typename: "PubIndexResult",
            id: "12",
            name: "Collected Rock Tabs",
            type: "BOOK",
            serialNumber: "0898987660",
          },
        ],
      },
    });
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
          id: "101",
          name: "Guitar World",
          type: "MAG",
          pubDate: "2026-06-01",
          serialNumber: "10456295",
          pubIndexId: "11",
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

async function chooseExistingMagazine() {
  const user = userEvent.setup();

  await user.click(await screen.findByRole("combobox", { name: "Magazine name" }));
  await user.click(
    await screen.findByRole("option", { name: "Guitar World (10456295)" }),
  );

  return user;
}

describe("AddPublicationView", () => {
  it("renders magazine issue fields by default and looks up existing magazines", async () => {
    const requests: AddPublicationIndexLookupVariables[] = [];
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
      await screen.findByRole("combobox", { name: "Magazine name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Serial number (ISSN)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Volume" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Issue" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Issue name" })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        requests.some((request) => request.criteria?.type === "MAG"),
      ).toBe(true);
    });
  });

  it("switches to the new book edition path", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Book edition" }));

    expect(screen.getByRole("combobox", { name: "Book title" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Serial number (ISBN)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Edition" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Volume" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Issue name" }),
    ).not.toBeInTheDocument();
  });

  it("validates required magazine identity and issue fields", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save publication" }));

    expect(await screen.findByText("Magazine name is required.")).toBeInTheDocument();
    expect(screen.getByText("ISSN is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Issue name is required for magazine issues."),
    ).toBeInTheDocument();
  });

  it("requires serial number for a typed new publication identity", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexLookupHandler());

    renderWithProviders(<AddPublicationView onCancel={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Magazine name" }), {
      target: { value: "New Guitar Magazine" },
    });
    await user.click(screen.getByRole("button", { name: "Save publication" }));

    expect(await screen.findByText("ISSN is required.")).toBeInTheDocument();
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
    fireEvent.change(screen.getByRole("textbox", { name: "Volume" }), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue" }), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue name" }), {
      target: { value: "Summer Songs" },
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
          id: "11",
        },
        info: {
          volume: "50",
          issue: "6",
          issueName: "Summer Songs",
        },
        transcriptions: [],
      },
    });
    expect(mutationRequests[0].magInput.pubId).toBeUndefined();
  });

  it("submits a typed new magazine identity through the GraphQL mutation", async () => {
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

    fireEvent.change(screen.getByRole("combobox", { name: "Magazine name" }), {
      target: { value: "New Guitar Magazine" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Serial number (ISSN)" }), {
      target: { value: "1234-5678" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue name" }), {
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
            serial: "1234-5678",
            type: "MAG",
          },
        },
      },
    });
    expect(mutationRequests[0].magInput.pubId).toBeUndefined();
  });
});
