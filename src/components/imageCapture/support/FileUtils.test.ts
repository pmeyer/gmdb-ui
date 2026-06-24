import { describe, expect, it } from "vitest";

import { fileReadToUrl, fileToDataUrl } from "./FileUtils";

describe("file utilities", () => {
  it("reads a file as a data URL", async () => {
    const file = new File(["image data"], "capture.txt", { type: "text/plain" });

    await expect(fileReadToUrl(file)).resolves.toEqual({
      file,
      dataUrl: "data:text/plain;base64,aW1hZ2UgZGF0YQ==",
    });
  });

  it("supports the nullable data URL reader", async () => {
    const file = new File(["test"], "capture.txt", { type: "text/plain" });
    const result = await fileToDataUrl(file);

    expect(result?.file).toBe(file);
    expect(result?.dataUrl).toBe("data:text/plain;base64,dGVzdA==");
  });
});
