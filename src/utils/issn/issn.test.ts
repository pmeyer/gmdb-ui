import { describe, expect, it } from "vitest";

import { formatISSN, isValidISSN, parseISSN } from "./issn";

describe("ISSN utilities", () => {
  it("parses and formats a valid compact ISSN", () => {
    expect(parseISSN("10456295")).toEqual({
      source: "10456295",
      issn: "1045-6295",
      checkDigit: "5",
      isValid: true,
      isIssn: true,
    });
  });

  it("parses a valid hyphenated ISSN with an X check digit", () => {
    expect(parseISSN("2434-561x")).toEqual({
      source: "2434-561x",
      issn: "2434-561X",
      checkDigit: "X",
      isValid: true,
      isIssn: true,
    });
  });

  it("rejects values with invalid shape or check digit", () => {
    expect(parseISSN("1045-6294")).toBeNull();
    expect(parseISSN("ISSN 1045-6295")).toBeNull();
    expect(parseISSN("1045629")).toBeNull();
  });

  it("provides formatting and validation helpers", () => {
    expect(formatISSN("10456295")).toBe("1045-6295");
    expect(formatISSN("1045-6294")).toBe("");
    expect(isValidISSN("1045-6295")).toBe(true);
    expect(isValidISSN("1045-6294")).toBe(false);
  });
});
