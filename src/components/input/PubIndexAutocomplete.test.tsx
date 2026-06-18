import { graphql, HttpResponse } from "msw";
import { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PubType } from "../../graphql/generated/graphql";
import { renderWithProviders } from "../../test/renderWithProviders";
import { server } from "../../test/server";
import { PubIndexAutocomplete } from "./PubIndexAutocomplete";
import type {
  PubIndexAutocompleteProps,
  PubIndexAutocompleteValue,
} from "./types";

interface GetPubIndicesVariables {
  pubType?: PubType;
}

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
  {
    __typename: "PubIndexResult",
    id: 13,
    name: "Guitar Player",
    type: "MAG",
    serialNumber: "00172916",
  },
] as const;

function publicationIndexHandler(
  onRequest?: (variables: GetPubIndicesVariables) => void,
) {
  return graphql.query("GetPubIndices", ({ variables }) => {
    const typedVariables = variables as GetPubIndicesVariables;
    onRequest?.(typedVariables);

    return HttpResponse.json({
      data: {
        getPubIndices:
          typedVariables.pubType === undefined
            ? publicationIndices
            : publicationIndices.filter(
                ({ type }) => type === typedVariables.pubType,
              ),
      },
    });
  });
}

interface ControlledAutocompleteProps
  extends Omit<PubIndexAutocompleteProps, "onChange" | "value"> {
  onValueChange: (value: PubIndexAutocompleteValue | null) => void;
}

function ControlledAutocomplete({
  onValueChange,
  ...props
}: ControlledAutocompleteProps) {
  const [value, setValue] = useState<PubIndexAutocompleteValue | null>(null);

  const handleChange = useCallback(
    (nextValue: PubIndexAutocompleteValue | null) => {
      setValue(nextValue);
      onValueChange(nextValue);
    },
    [onValueChange],
  );

  return (
    <PubIndexAutocomplete
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
}

describe("PubIndexAutocomplete", () => {
  it.each([
    {
      optionName: /Guitar World/,
      expected: {
        kind: "existing",
        name: "Guitar World",
        identity: {
          id: 11,
          type: "MAG",
          serialNumber: "10456295",
        },
      },
    },
    {
      optionName: /Collected Rock Tabs/,
      expected: {
        kind: "existing",
        name: "Collected Rock Tabs",
        identity: {
          id: 12,
          type: "BOOK",
          serialNumber: "0898987660",
        },
      },
    },
  ] as const)("selects the existing $expected.identity.type publication", async ({
    optionName,
    expected,
  }) => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <ControlledAutocomplete onValueChange={handleChange} />,
    );

    await user.click(screen.getByRole("combobox", { name: "Publication" }));
    await user.click(await screen.findByRole("option", { name: optionName }));

    expect(handleChange).toHaveBeenLastCalledWith(expected);
    expect(screen.getByRole("combobox", { name: "Publication" })).toHaveValue(
      expected.name,
    );
  });

  it.each([
    { pubType: "MAG", visibleName: /Guitar World/, hiddenName: /Collected Rock Tabs/ },
    { pubType: "BOOK", visibleName: /Collected Rock Tabs/, hiddenName: /Guitar World/ },
  ] as const)("scopes publication options to $pubType", async ({
    pubType,
    visibleName,
    hiddenName,
  }) => {
    const user = userEvent.setup();
    const requests: GetPubIndicesVariables[] = [];
    server.use(
      publicationIndexHandler((variables) => {
        requests.push(variables);
      }),
    );
    renderWithProviders(
      <PubIndexAutocomplete
        value={null}
        onChange={vi.fn()}
        pubType={pubType}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Publication" }));

    expect(await screen.findByRole("option", { name: visibleName })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: hiddenName })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(requests).toContainEqual({ pubType });
    });
  });

  it("adds a trimmed new publication when allowAddNew is enabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <ControlledAutocomplete
        allowAddNew
        onValueChange={handleChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Publication" });
    await user.type(input, "  New Guitar Book  ");
    await user.click(
      await screen.findByRole("option", { name: 'Add "New Guitar Book"' }),
    );

    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "new",
      name: "New Guitar Book",
    });
    expect(input).toHaveValue("New Guitar Book");
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("preserves the raw title when an edited new publication is reselected", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <ControlledAutocomplete
        allowAddNew
        onValueChange={handleChange}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Publication" });
    await user.type(input, "New Mag");
    await user.click(
      await screen.findByRole("option", { name: 'Add "New Mag"' }),
    );
    await user.type(input, "{Backspace}");
    expect(
      await screen.findByRole("option", { name: 'Add "New Ma"' }),
    ).toBeInTheDocument();
    await user.type(input, "g");
    await user.click(
      await screen.findByRole("option", { name: 'Add "New Mag"' }),
    );

    expect(input).toHaveValue("New Mag");
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "new",
      name: "New Mag",
    });
  });

  it("preserves a new publication when focus returns and leaves again", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <>
        <ControlledAutocomplete
          allowAddNew
          onValueChange={handleChange}
        />
        <input aria-label="Serial number" />
      </>,
    );

    const publicationInput = screen.getByRole("combobox", {
      name: "Publication",
    });
    await user.type(publicationInput, "New Guitar Book");
    await user.tab();
    await user.tab({ shift: true });
    await user.tab();

    expect(screen.getByRole("textbox", { name: "Serial number" })).toHaveFocus();
    expect(publicationInput).toHaveValue("New Guitar Book");
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "new",
      name: "New Guitar Book",
    });
  });

  it("treats a partial existing title as new when focus leaves", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <>
        <ControlledAutocomplete
          allowAddNew
          onValueChange={handleChange}
        />
        <input aria-label="Serial number" />
      </>,
    );

    const publicationInput = screen.getByRole("combobox", {
      name: "Publication",
    });
    await user.type(publicationInput, "Guitar W");
    await user.tab();
    await user.tab({ shift: true });
    await user.tab();

    expect(publicationInput).toHaveValue("Guitar W");
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "new",
      name: "Guitar W",
    });
  });

  it("preserves an explicitly added title that partially matches an existing publication", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <>
        <ControlledAutocomplete
          allowAddNew
          onValueChange={handleChange}
        />
        <input aria-label="Serial number" />
      </>,
    );

    const publicationInput = screen.getByRole("combobox", {
      name: "Publication",
    });
    await user.type(publicationInput, "Guitar W");
    await user.click(
      await screen.findByRole("option", { name: 'Add "Guitar W"' }),
    );
    await user.tab();
    await user.tab({ shift: true });
    await user.tab();

    expect(publicationInput).toHaveValue("Guitar W");
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "new",
      name: "Guitar W",
    });
  });

  it("selects an exact existing publication when focus leaves", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <>
        <ControlledAutocomplete
          allowAddNew
          onValueChange={handleChange}
        />
        <input aria-label="Serial number" />
      </>,
    );

    const publicationInput = screen.getByRole("combobox", {
      name: "Publication",
    });
    await user.type(publicationInput, "  guitar world  ");
    await user.tab();
    await user.tab({ shift: true });
    await user.tab();

    expect(screen.getByRole("textbox", { name: "Serial number" })).toHaveFocus();
    expect(publicationInput).toHaveValue("Guitar World");
    expect(handleChange).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenLastCalledWith({
      kind: "existing",
      name: "Guitar World",
      identity: {
        id: 11,
        type: "MAG",
        serialNumber: "10456295",
      },
    });
  });

  it("does not offer a case-insensitive existing title as a new publication", async () => {
    const user = userEvent.setup();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <PubIndexAutocomplete
        allowAddNew
        value={null}
        onChange={vi.fn()}
      />,
    );

    await user.type(
      screen.getByRole("combobox", { name: "Publication" }),
      "  guitar world  ",
    );

    expect(await screen.findByRole("option", { name: /Guitar World/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Add "guitar world"/ }),
    ).not.toBeInTheDocument();
  });

  it("does not allow arbitrary new values unless allowAddNew is enabled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    server.use(publicationIndexHandler());
    renderWithProviders(
      <ControlledAutocomplete onValueChange={handleChange} />,
    );

    await user.type(
      screen.getByRole("combobox", { name: "Publication" }),
      "Unknown Publication",
    );
    await user.keyboard("{Enter}");

    expect(handleChange).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("option", { name: /Add "Unknown Publication"/ }),
    ).not.toBeInTheDocument();
  });

  it("supports a disabled state", () => {
    server.use(publicationIndexHandler());
    renderWithProviders(
      <PubIndexAutocomplete
        disabled
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Publication" })).toBeDisabled();
  });

  it("displays supplied error text as accessible helper text", () => {
    server.use(publicationIndexHandler());
    renderWithProviders(
      <PubIndexAutocomplete
        errorText="Publication is required."
        value={null}
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Publication" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Publication is required.");
    expect(screen.getByText("Publication is required.")).toBeInTheDocument();
  });
});
