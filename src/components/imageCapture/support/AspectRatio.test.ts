import { describe, expect, it } from "vitest";

import { AspectRatios, resolveAspectRatio } from "./AspectRatio";

describe("aspect ratios", () => {
  it("calculates dimensions using the configured ratio", () => {
    expect(AspectRatios.US_LETTER.ratio).toBeCloseTo(8.5 / 11);
    expect(AspectRatios.US_LETTER.calcHeight(850)).toBeCloseTo(1100);
    expect(AspectRatios.US_LETTER.calcWidth(1100)).toBeCloseTo(850);
    expect(AspectRatios.SIXTEEN_NINE.calcHeight(1920)).toBe(1080);
  });

  it("resolves named and explicit aspect ratios", () => {
    expect(resolveAspectRatio("A4")).toBe(AspectRatios.A4);
    expect(resolveAspectRatio(AspectRatios.SQUARE)).toBe(AspectRatios.SQUARE);
    expect(resolveAspectRatio("")).toBeUndefined();
    expect(resolveAspectRatio()).toBeUndefined();
  });
});
