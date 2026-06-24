import { describe, expect, it, vi } from "vitest";

import { canvasToBlob, canvasToFile, stopVideoStream } from "./Utilities";

describe("image capture utilities", () => {
  it("stops every video track in a stream", () => {
    const firstTrack = { stop: vi.fn() };
    const secondTrack = { stop: vi.fn() };
    const stream = {
      getVideoTracks: () => [firstTrack, secondTrack],
    } as unknown as MediaStream;

    stopVideoStream(stream);

    expect(firstTrack.stop).toHaveBeenCalledOnce();
    expect(secondTrack.stop).toHaveBeenCalledOnce();
  });

  it("converts an offscreen canvas using its promise API", async () => {
    const blob = new Blob(["offscreen"], { type: "image/png" });
    const convertToBlob = vi.fn().mockResolvedValue(blob);
    const canvas = { convertToBlob } as unknown as OffscreenCanvas;
    const options = { type: "image/png", quality: 0.8 };

    await expect(canvasToBlob(canvas, options)).resolves.toBe(blob);
    expect(convertToBlob).toHaveBeenCalledWith(options);
  });

  it("converts an HTML canvas using its callback API", async () => {
    const blob = new Blob(["html"], { type: "image/jpeg" });
    const toBlob = vi.fn((callback: BlobCallback) => { callback(blob); });
    const canvas = { toBlob } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas, { type: "image/jpeg", quality: 1 })).resolves.toBe(blob);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 1);
  });

  it("rejects when an HTML canvas cannot produce a blob", async () => {
    const canvas = {
      toBlob: (callback: BlobCallback) => { callback(null); },
    } as unknown as HTMLCanvasElement;

    await expect(canvasToBlob(canvas)).rejects.toThrow("Canvas.toBlob returned null blob");
  });

  it("creates a named JPEG file and data URL", async () => {
    const canvas = {
      convertToBlob: vi.fn().mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" })),
    } as unknown as OffscreenCanvas;

    const result = await canvasToFile(canvas, "cover");

    expect(result.file.name).toBe("cover.jpg");
    expect(result.file.type).toBe("image/jpeg");
    expect(result.dataUrl).toBe("data:image/jpeg;base64,anBlZw==");
  });
});
