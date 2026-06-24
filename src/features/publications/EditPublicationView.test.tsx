import { graphql, HttpResponse, delay } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";

import { selectDatePickerMonthYear } from "../../test/datePickerTestUtils";
import { server } from "../../test/server";
import { renderWithProviders } from "../../test/renderWithProviders";
import { EditPublicationView } from "./EditPublicationView";

interface MockImageInputProps {
  emptyImagePoster?: string;
  existingImage?: string;
  image?: { dataUrl: string; file: File } | null;
}

vi.mock("../../components/input/ImageInput", () => ({
  ImageInput: function MockImageInput({
    emptyImagePoster,
    existingImage,
    image,
  }: MockImageInputProps) {
    const imageUrl = image === undefined
      ? existingImage ?? emptyImagePoster
      : image?.dataUrl ?? emptyImagePoster;

    return <img alt="Current Image" src={imageUrl} />;
  },
}));

interface PublicationDetailVariables {
  id?: unknown;
}

interface EditMagazineIssueVariables {
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

interface GetPubIndicesVariables {
  pubType?: string;
}

interface GetPubsForIndexVariables {
  pubIndexId: number;
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
        serialNumber: "ISSN 1045-6295",
      },
      {
        __typename: "PubIndexResult",
        id: 13,
        name: "Guitar for the Practicing Musician",
        type: "MAG",
        serialNumber: "ISSN 0748-9637",
      },
      {
        __typename: "PubIndexResult",
        id: 12,
        name: "Collected Rock Tabs",
        type: "BOOK",
        serialNumber: "ISBN 978-1-2345-6789-0",
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
    const publications = publicationDetailResults.filter(
      (publication) => publication.pubIndexId === pubIndexId,
    ).map(({ id, pubDate, details }) => ({
      __typename: "PubSearchResult",
      id,
      pubDate,
      details,
    }));

    return HttpResponse.json({ data: { pubSearch: publications } });
  });
}

function getAutocompleteClearButton(name: string) {
  const input = screen.getByRole("combobox", { name });
  const autocomplete = input.closest(".MuiAutocomplete-root");

  if (!(autocomplete instanceof HTMLElement)) {
    throw new Error(`Autocomplete root not found for ${name}.`);
  }

  return within(autocomplete).getByLabelText("Clear");
}

function comparableId(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? value.toString()
    : undefined;
}

function publicationDetailHandler(
  pubSearch: unknown[],
  onRequest?: (variables: PublicationDetailVariables) => void,
) {
  return graphql.query("PublicationDetailCatalog", ({ variables }) => {
    const detailVariables = variables as PublicationDetailVariables;
    const criteriaId = comparableId(detailVariables.id);

    onRequest?.(detailVariables);

    return HttpResponse.json({
      data: {
        pubSearch:
          criteriaId === undefined
            ? pubSearch
            : pubSearch.filter(
                (publication) =>
                  typeof publication === "object" &&
                  publication !== null &&
                  "id" in publication &&
                  comparableId(publication.id) === criteriaId,
              ),
      },
    });
  });
}

function editMagazineIssueHandler(
  onRequest: (variables: EditMagazineIssueVariables) => void,
) {
  return graphql.mutation("AddMagazineIssue", ({ variables }) => {
    onRequest(variables as EditMagazineIssueVariables);

    return HttpResponse.json({
      data: {
        addMagazineIssue: {
          __typename: "PubSearchResult",
          id: 1,
          name: "Guitar World Updated",
          type: "MAG",
          pubDate: "1992-07-01",
          serialNumber: "ISSN 1045-6295",
          pubIndexId: 11,
          details: {
            __typename: "MagDetails",
            cover: "/resources/publications/1/cover",
            volume: "13",
            issue: "5",
            issueName: "Updated Songs",
          },
          transcriptions: [],
        },
      },
    });
  });
}

const publicationDetailResults = [
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
    transcriptions: [],
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

describe("EditPublicationView", () => {
  beforeEach(() => {
    server.use(publicationInstanceLookupHandler());
  });
  it("shows loading placeholders while publication data is loading", () => {
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
      <EditPublicationView
        publicationId="1"
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Loading publication edit form")).toBeInTheDocument();
  });

  it("pre-populates magazine issue metadata from GraphQL", async () => {
    server.use(publicationDetailHandler(publicationDetailResults), publicationIndexLookupHandler());

    renderWithProviders(
      <EditPublicationView
        publicationId="1"
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Edit publication" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Magazine issue" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Magazine issue" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Publication" })).toHaveValue(
      "Guitar World",
    );
    expect(screen.getByRole("textbox", { name: "Serial number (ISSN)" })).toHaveValue(
      "ISSN 1045-6295",
    );
    expect(screen.getByRole("textbox", { name: "Serial number (ISSN)" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Volume" })).toHaveValue("12");
    expect(screen.getByRole("textbox", { name: "Issue" })).toHaveValue("4");
    expect(screen.getByRole("combobox", { name: "Issue Name" })).toHaveValue(
      "Summer Songs",
    );
    expect(screen.getByRole("group", { name: "Publication date" })).toHaveTextContent(
      "Jun 1992",
    );
    expect(screen.getByAltText("Current Image")).toHaveAttribute(
      "src",
      "/resources/publications/1/cover",
    );
  });

  it("pre-populates book edition metadata without magazine-only fields", async () => {
    server.use(publicationDetailHandler(publicationDetailResults), publicationIndexLookupHandler());

    renderWithProviders(
      <EditPublicationView
        publicationId="2"
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole("combobox", { name: "Publication" }),
    ).toHaveValue("Collected Rock Tabs");
    expect(screen.getByRole("button", { name: "Book edition" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("combobox", { name: "Edition" })).toHaveValue(
      "First edition",
    );
    expect(screen.queryByRole("textbox", { name: "Volume" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Issue Name" }),
    ).not.toBeInTheDocument();
  });

  it("submits updated magazine metadata with the current publication identity id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: EditMagazineIssueVariables[] = [];
    server.use(
      publicationDetailHandler(publicationDetailResults),
      publicationIndexLookupHandler(),
      editMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(
      <EditPublicationView publicationId="1" onCancel={vi.fn()} onSaved={onSaved} />,
    );

    expect(await screen.findByRole("combobox", { name: "Publication" })).toHaveValue(
      "Guitar World",
    );
    await user.click(getAutocompleteClearButton("Issue Name"));
    const issueNameInput = screen.getByRole("combobox", { name: "Issue Name" });
    await user.type(issueNameInput, "Updated Songs");
    await user.click(
      await screen.findByRole("option", { name: 'Add "Updated Songs"' }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Volume" }), {
      target: { value: "13" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue" }), {
      target: { value: "5" },
    });
    await selectDatePickerMonthYear(user, {
      fieldName: "Publication date",
      monthName: "July",
      year: 1992,
    });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("1");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        index: {
          id: 11,
        },
        info: {
          volume: "13",
          issue: "5",
          issueName: "Updated Songs",
        },
        pubDate: dayjs().year(1992).month(6).format("YYYY-MM-DD"),
        pubId: 1,
      },
    });
    expect(mutationRequests[0].magInput.transcriptions).toBeUndefined();
  }, 25000);

  it("submits a different selected existing magazine identity id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: EditMagazineIssueVariables[] = [];
    const lookupRequests: GetPubIndicesVariables[] = [];
    server.use(
      publicationDetailHandler(publicationDetailResults),
      publicationIndexLookupHandler((variables) => {
        lookupRequests.push(variables);
      }),
      editMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(
      <EditPublicationView publicationId="1" onCancel={vi.fn()} onSaved={onSaved} />,
    );

    await waitFor(() => {
      expect(lookupRequests).toHaveLength(1);
    });
    const identityInput = await screen.findByRole("combobox", {
      name: "Publication",
    });
    await user.click(getAutocompleteClearButton("Publication"));
    await user.click(identityInput);
    await user.click(
      await screen.findByRole("option", {
        name: /Guitar for the Practicing Musician/,
      }),
    );
    expect(screen.getByRole("textbox", { name: "Serial number (ISSN)" })).toHaveValue(
      "ISSN 0748-9637",
    );
    expect(screen.getByRole("textbox", { name: "Serial number (ISSN)" })).toBeDisabled();
    const issueNameInput = await screen.findByRole("combobox", { name: "Issue Name" });
    await user.type(issueNameInput, "Transferred Issue");
    await user.click(
      await screen.findByRole("option", { name: 'Add "Transferred Issue"' }),
    );
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("1");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        index: {
          id: 13,
        },
        pubId: 1,
      },
    });
  }, 10000);

  it("submits a typed new magazine identity with required serial number", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const mutationRequests: EditMagazineIssueVariables[] = [];
    server.use(
      publicationDetailHandler(publicationDetailResults),
      publicationIndexLookupHandler(),
      editMagazineIssueHandler((variables) => {
        mutationRequests.push(variables);
      }),
    );

    renderWithProviders(
      <EditPublicationView publicationId="1" onCancel={vi.fn()} onSaved={onSaved} />,
    );

    await screen.findByRole("combobox", { name: "Publication" });
    await user.click(getAutocompleteClearButton("Publication"));
    await user.type(
      screen.getByRole("combobox", { name: "Publication" }),
      "New Guitar Identity",
    );
    await user.click(
      await screen.findByRole("option", {
        name: 'Add "New Guitar Identity"',
      }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Serial number (ISSN)" }), {
      target: { value: "ISSN 2222-3333" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Issue Name" }), {
      target: { value: "New Issue" },
    });
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith("1");
    });
    expect(mutationRequests[0]).toMatchObject({
      magInput: {
        index: {
          data: {
            name: "New Guitar Identity",
            serial: "ISSN 2222-3333",
            type: "MAG",
          },
        },
        pubId: 1,
      },
    });
  }, 10000);

  it("shows validation errors before submitting invalid magazine edits", async () => {
    const user = userEvent.setup();
    server.use(publicationDetailHandler(publicationDetailResults), publicationIndexLookupHandler());

    renderWithProviders(
      <EditPublicationView
        publicationId="1"
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await screen.findByRole("combobox", { name: "Publication" });
    await user.click(getAutocompleteClearButton("Publication"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Magazine name is required.")).toBeInTheDocument();
    expect(screen.getByText("Serial number is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Issue name is required for magazine issues."),
    ).toBeInTheDocument();
  });
});
