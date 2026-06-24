import { describe, expect, it, vi } from "vitest";

import { AspectRatios } from "./AspectRatio";
import { CapturedImage } from "./CapturedImage";

function createBitmap(width = 1600, height = 900) {
  const close = vi.fn();
  return {
    bitmap: {
      width,
      height,
      close,
    } as unknown as ImageBitmap,
    close,
  };
}

function createCanvas() {
  const drawImage = vi.fn();
  const context = {
    canvas: { width: 0, height: 0 },
    drawImage,
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
    toBlob: vi.fn(),
  } as unknown as HTMLCanvasElement;

  return { canvas, context, drawImage };
}

describe("CapturedImage", () => {
  it("calculates a centered crop rectangle", () => {
    const { bitmap } = createBitmap();
    const image = new CapturedImage(bitmap);

    expect(image.getCropRect(AspectRatios.SQUARE)).toEqual({
      x: 350,
      y: 0,
      w: 900,
      h: 900,
    });
  });

  it("draws the cropped image without consuming its bitmap", () => {
    const { bitmap, close } = createBitmap();
    const { canvas, drawImage } = createCanvas();
    const image = new CapturedImage(bitmap);

    expect(image.drawToCanvas(canvas, { autoCropAspectRation: AspectRatios.SQUARE })).toBe(canvas);
    expect(canvas.width).toBe(900);
    expect(canvas.height).toBe(900);
    expect(drawImage).toHaveBeenCalledWith(
      bitmap,
      350,
      0,
      900,
      900,
      0,
      0,
      900,
      900,
    );
    expect(close).not.toHaveBeenCalled();

    expect(() => image.getCropRect(AspectRatios.SQUARE)).not.toThrow();
  });

  it("transfers ownership explicitly and rejects subsequent operations", () => {
    const { bitmap, close } = createBitmap();
    const transferFromImageBitmap = vi.fn();
    const context = { transferFromImageBitmap } as unknown as ImageBitmapRenderingContext;
    const image = new CapturedImage(bitmap);

    image.transferTo(context);

    expect(transferFromImageBitmap).toHaveBeenCalledWith(bitmap);
    expect(close).not.toHaveBeenCalled();
    expect(() => image.getCropRect(AspectRatios.SQUARE)).toThrow(
      "Captured image no longer owns an ImageBitmap",
    );
  });

  it("closes its bitmap idempotently", () => {
    const { bitmap, close } = createBitmap();
    const image = new CapturedImage(bitmap);

    image.close();
    image.close();

    expect(close).toHaveBeenCalledOnce();
    expect(() => image.getCropRect(AspectRatios.SQUARE)).toThrow(
      "Captured image no longer owns an ImageBitmap",
    );
  });

  it("rejects a canvas without a two-dimensional context", () => {
    const { bitmap } = createBitmap();
    const canvas = {
      getContext: () => null,
      toBlob: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const image = new CapturedImage(bitmap);

    expect(() => image.drawToCanvas(canvas)).toThrow("Cannot get Canvas Context");
  });
});
