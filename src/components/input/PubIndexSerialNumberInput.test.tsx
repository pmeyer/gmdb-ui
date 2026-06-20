import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { FormattedSerialNumber } from "../../utils/serialNumberUtils";
import { PubIndexSerialNumberInput } from "./PubIndexSerialNumberInput";

interface ControlledSerialNumberInputProps {
  initialValue: string | FormattedSerialNumber;
  onValueChange: (value: FormattedSerialNumber) => void;
}

function ControlledSerialNumberInput({
  initialValue,
  onValueChange,
}: ControlledSerialNumberInputProps) {
  const [value, setValue] = useState<string | FormattedSerialNumber>(initialValue);

  const handleChange = useCallback(
    (nextValue: FormattedSerialNumber) => {
      setValue(nextValue);
      onValueChange(nextValue);
    },
    [onValueChange],
  );

  return <PubIndexSerialNumberInput value={value} onChange={handleChange} />;
}

describe("PubIndexSerialNumberInput", () => {
  it("formats the required value and labels the detected format", () => {
    render(<PubIndexSerialNumberInput value="10456295" />);

    expect(
      screen.getByRole("textbox", { name: "Serial Number (ISSN/ISBN)" }),
    ).toHaveValue("1045-6295");
    expect(screen.getByText("ISSN")).toBeInTheDocument();
  });

  it("accepts a preformatted serial value", () => {
    render(
      <PubIndexSerialNumberInput
        value={{ format: "ISBN-13", formattedValue: "978-0-306-40615-7" }}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: "Serial Number (ISSN/ISBN)" }),
    ).toHaveValue("978-0-306-40615-7");
    expect(screen.getByText("ISBN-13")).toBeInTheDocument();
  });

  it("reflects controlled value updates after mount", () => {
    const { rerender } = render(<PubIndexSerialNumberInput value="10456295" />);

    rerender(<PubIndexSerialNumberInput value="0898987660" />);

    expect(
      screen.getByRole("textbox", { name: "Serial Number (ISSN/ISBN)" }),
    ).toHaveValue("0-89898-766-0");
    expect(screen.getByText("ISBN-10")).toBeInTheDocument();
  });

  it("emits formatted values while the parent controls the rendered value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <ControlledSerialNumberInput initialValue="" onValueChange={handleChange} />,
    );

    const input = screen.getByRole("textbox", { name: "Serial Number (ISSN/ISBN)" });
    await user.type(input, "10456295");

    expect(input).toHaveValue("1045-6295");
    expect(screen.getByText("ISSN")).toBeInTheDocument();
    expect(handleChange).toHaveBeenLastCalledWith({
      format: "ISSN",
      formattedValue: "1045-6295",
    });
  });

  it("passes selected text field props through", () => {
    render(
      <PubIndexSerialNumberInput
        value=""
        label="Publication identifier"
        disabled
        fullWidth
      />,
    );

    const input = screen.getByRole("textbox", { name: "Publication identifier" });

    expect(input).toBeDisabled();
    expect(input.closest(".MuiFormControl-root")).toHaveClass("MuiFormControl-fullWidth");
  });

  it("passes required state through", () => {
    render(
      <PubIndexSerialNumberInput
        value=""
        label="Publication identifier"
        required
      />,
    );

    expect(screen.getByRole("textbox", { name: /Publication identifier/ })).toBeRequired();
  });

  it("passes error state and helper text through", () => {
    render(
      <PubIndexSerialNumberInput
        value=""
        label="Publication identifier"
        error
        helperText="Serial number is required."
      />,
    );

    const input = screen.getByRole("textbox", { name: "Publication identifier" });
    const helperText = screen.getByText("Serial number is required.");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(helperText).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription("Serial number is required.");
  });

  it("supports read-only input", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <PubIndexSerialNumberInput value="" onChange={handleChange} readOnly />,
    );

    const input = screen.getByRole("textbox", { name: "Serial Number (ISSN/ISBN)" });
    expect(input).toHaveAttribute("readonly");

    await user.type(input, "10456295");

    expect(input).toHaveValue("");
    expect(handleChange).not.toHaveBeenCalled();
  });
});
