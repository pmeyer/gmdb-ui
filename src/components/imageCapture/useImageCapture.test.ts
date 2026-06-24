import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CapturedImage } from "./support/CapturedImage";
import type { VideoStream } from "./support/VideoStream";
import { useImageCapture } from "./useImageCapture";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function createBitmap(width = 1600, height = 900) {
  const close = vi.fn();
  const bitmap = { width, height, close } as unknown as ImageBitmap;
  return { bitmap, close };
}

function createVideoStream(takePhoto: () => Promise<Blob>) {
  return {
    getImageCapture: () => ({ takePhoto }),
  } as unknown as VideoStream;
}

describe("useImageCapture", () => {
  let createImageBitmapMock: ReturnType<
    typeof vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>
  >;

  beforeEach(() => {
    createImageBitmapMock = vi.fn<(source: ImageBitmapSource) => Promise<ImageBitmap>>();
    vi.stubGlobal("createImageBitmap", createImageBitmapMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts idle and reports a missing stream as an error", async () => {
    const { result } = renderHook(() => useImageCapture(null));

    expect(result.current).toMatchObject({
      status: "idle",
      result: null,
      error: null,
    });

    await act(async () => {
      await expect(result.current.takePhoto()).resolves.toBeNull();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toEqual(
      new Error("Cannot take a photo without an active video stream"),
    );
  });

  it("captures an image and publishes a hook-owned result", async () => {
    const blob = new Blob(["photo"], { type: "image/jpeg" });
    const takePhoto = vi.fn().mockResolvedValue(blob);
    const { bitmap } = createBitmap();
    createImageBitmapMock.mockResolvedValue(bitmap);
    const stream = createVideoStream(takePhoto);
    const { result } = renderHook(() => useImageCapture(stream));
    let capture: CapturedImage | null = null;

    await act(async () => {
      capture = await result.current.takePhoto();
    });

    expect(takePhoto).toHaveBeenCalledOnce();
    expect(createImageBitmapMock).toHaveBeenCalledWith(blob);
    expect(capture).toBeInstanceOf(CapturedImage);
    expect(result.current).toMatchObject({
      status: "complete",
      result: capture,
      error: null,
    });
  });

  it("ignores a duplicate request while capture is in flight", async () => {
    const pendingPhoto = deferred<Blob>();
    const takePhoto = vi.fn(() => pendingPhoto.promise);
    const { bitmap } = createBitmap();
    createImageBitmapMock.mockResolvedValue(bitmap);
    const stream = createVideoStream(takePhoto);
    const { result } = renderHook(() => useImageCapture(stream));
    let firstRequest!: Promise<CapturedImage | null>;

    act(() => {
      firstRequest = result.current.takePhoto();
    });
    expect(result.current.status).toBe("busy");

    await act(async () => {
      await expect(result.current.takePhoto()).resolves.toBeNull();
    });
    expect(takePhoto).toHaveBeenCalledOnce();

    pendingPhoto.resolve(new Blob(["photo"]));
    await act(async () => { await firstRequest; });
    expect(result.current.status).toBe("complete");
  });

  it("closes the previous result before replacing it", async () => {
    const takePhoto = vi.fn().mockResolvedValue(new Blob(["photo"]));
    const firstBitmap = createBitmap();
    const secondBitmap = createBitmap();
    createImageBitmapMock
      .mockResolvedValueOnce(firstBitmap.bitmap)
      .mockResolvedValueOnce(secondBitmap.bitmap);
    const stream = createVideoStream(takePhoto);
    const { result } = renderHook(() => useImageCapture(stream));

    await act(async () => { await result.current.takePhoto(); });
    expect(firstBitmap.close).not.toHaveBeenCalled();

    await act(async () => { await result.current.takePhoto(); });

    expect(firstBitmap.close).toHaveBeenCalledOnce();
    expect(secondBitmap.close).not.toHaveBeenCalled();
    expect(result.current.status).toBe("complete");
  });

  it("closes the current result and appears idle after the stream changes", async () => {
    const firstBitmap = createBitmap();
    createImageBitmapMock.mockResolvedValue(firstBitmap.bitmap);
    const firstStream = createVideoStream(vi.fn().mockResolvedValue(new Blob(["one"])));
    const secondStream = createVideoStream(vi.fn().mockResolvedValue(new Blob(["two"])));
    const { result, rerender } = renderHook(
      ({ stream }: { stream: VideoStream | null }) => useImageCapture(stream),
      { initialProps: { stream: firstStream } },
    );
    await act(async () => { await result.current.takePhoto(); });

    rerender({ stream: secondStream });

    await waitFor(() => { expect(firstBitmap.close).toHaveBeenCalledOnce(); });
    expect(result.current).toMatchObject({
      status: "idle",
      result: null,
      error: null,
    });
  });

  it("closes a stale capture that finishes after the stream changes", async () => {
    const pendingPhoto = deferred<Blob>();
    const staleBitmap = createBitmap();
    createImageBitmapMock.mockResolvedValue(staleBitmap.bitmap);
    const firstStream = createVideoStream(vi.fn(() => pendingPhoto.promise));
    const secondStream = createVideoStream(vi.fn().mockResolvedValue(new Blob(["two"])));
    const { result, rerender } = renderHook(
      ({ stream }: { stream: VideoStream }) => useImageCapture(stream),
      { initialProps: { stream: firstStream } },
    );
    let request!: Promise<CapturedImage | null>;
    act(() => { request = result.current.takePhoto(); });

    rerender({ stream: secondStream });
    pendingPhoto.resolve(new Blob(["one"]));

    await act(async () => { await expect(request).resolves.toBeNull(); });
    expect(staleBitmap.close).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ status: "idle", result: null });
  });

  it("normalizes non-Error capture failures", async () => {
    const stream = createVideoStream(vi.fn().mockRejectedValue("capture failed"));
    const { result } = renderHook(() => useImageCapture(stream));

    await act(async () => {
      await expect(result.current.takePhoto()).resolves.toBeNull();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual(new Error("Unable to capture image"));
  });

  it("closes the current result when the hook unmounts", async () => {
    const { bitmap, close } = createBitmap();
    createImageBitmapMock.mockResolvedValue(bitmap);
    const stream = createVideoStream(vi.fn().mockResolvedValue(new Blob(["photo"])));
    const { result, unmount } = renderHook(() => useImageCapture(stream));
    await act(async () => { await result.current.takePhoto(); });

    unmount();

    expect(close).toHaveBeenCalledOnce();
  });

  it("transfers result ownership without closing it during later cleanup", async () => {
    const transferredBitmap = createBitmap();
    createImageBitmapMock.mockResolvedValue(transferredBitmap.bitmap);
    const firstStream = createVideoStream(
      vi.fn().mockResolvedValue(new Blob(["photo"])),
    );
    const secondStream = createVideoStream(
      vi.fn().mockResolvedValue(new Blob(["next"])),
    );
    const { result, rerender, unmount } = renderHook(
      ({ stream }: { stream: VideoStream }) => useImageCapture(stream),
      { initialProps: { stream: firstStream } },
    );

    await act(async () => { await result.current.takePhoto(); });
    const capture = result.current.result;
    if (capture === null) {
      throw new Error("Expected a captured image before ownership transfer");
    }
    act(() => { expect(result.current.takeResult()).toBe(capture); });

    expect(capture).toBeInstanceOf(CapturedImage);
    expect(result.current).toMatchObject({
      status: "idle",
      result: null,
      error: null,
    });

    rerender({ stream: secondStream });
    unmount();

    expect(transferredBitmap.close).not.toHaveBeenCalled();
    capture.close();
    expect(transferredBitmap.close).toHaveBeenCalledOnce();
  });
});
