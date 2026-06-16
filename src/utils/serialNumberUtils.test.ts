import { describe, expect, it } from "vitest";

import {
  getFormattedSerialNumber,
  isFormattedSerial,
  isISBN10,
  isISBN13,
  parseSerial,
} from "./serialNumberUtils";

describe("serial number utilities", () => {
  it("formats ISBN-10 values", () => {
    expect(getFormattedSerialNumber("0898987660")).toEqual({
      format: "ISBN-10",
      formattedValue: "0-89898-766-0",
    });
  });

  it("formats ISBN-13 values", () => {
    expect(getFormattedSerialNumber("9780306406157")).toEqual({
      format: "ISBN-13",
      formattedValue: "978-0-306-40615-7",
    });
  });

  it("formats ISSN values after ISBN parsing fails", () => {
    expect(getFormattedSerialNumber("10456295")).toEqual({
      format: "ISSN",
      formattedValue: "1045-6295",
    });
  });

  it("preserves unrecognized input", () => {
    expect(getFormattedSerialNumber("not a serial")).toEqual({
      formattedValue: "not a serial",
    });
    expect(getFormattedSerialNumber(null)).toEqual({
      formattedValue: "",
    });
  });

  it("identifies formatted serial values", () => {
    expect(isFormattedSerial({ formattedValue: "1045-6295", format: "ISSN" })).toBe(
      true,
    );
    expect(isFormattedSerial("1045-6295")).toBe(false);
    expect(isFormattedSerial(undefined)).toBe(false);
  });

  it("narrows ISBN formats without matching null or ISSN values", () => {
    const isbn10 = parseSerial("0898987660");
    const isbn13 = parseSerial("9780306406157");
    const issn = parseSerial("10456295");

    expect(isISBN10(isbn10)).toBe(true);
    expect(isISBN13(isbn10)).toBe(false);
    expect(isISBN10(isbn13)).toBe(false);
    expect(isISBN13(isbn13)).toBe(true);
    expect(isISBN10(issn)).toBe(false);
    expect(isISBN13(issn)).toBe(false);
    expect(isISBN10(null)).toBe(false);
    expect(isISBN13(null)).toBe(false);
  });
});
