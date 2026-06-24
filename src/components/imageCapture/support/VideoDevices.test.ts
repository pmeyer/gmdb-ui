import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStream() {
  const stop = vi.fn();
  return {
    stop,
    stream: {
      getVideoTracks: () => [{ stop }],
    } as unknown as MediaStream,
  };
}

function createDevice(deviceId: string) {
  return {
    deviceId,
    groupId: "group",
    kind: "videoinput",
    label: `Camera ${deviceId}`,
    toJSON: () => ({}),
  } as MediaDeviceInfo;
}

interface MediaDevicesMock {
  addEventListener: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
  getUserMedia: ReturnType<typeof vi.fn>;
}

function installMediaDevices(devices: MediaDeviceInfo[] = [createDevice("one")]) {
  let deviceChangeHandler: EventListener | undefined;
  const mediaDevices: MediaDevicesMock = {
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === "devicechange") {
        deviceChangeHandler = listener;
      }
    }),
    enumerateDevices: vi.fn().mockResolvedValue(devices),
    getUserMedia: vi.fn().mockResolvedValue(createStream().stream),
  };
  vi.stubGlobal("navigator", { mediaDevices });

  return {
    mediaDevices,
    signalDeviceChange: () => { deviceChangeHandler?.(new Event("devicechange")); },
  };
}

async function loadVideoDevices() {
  return (await import("./VideoDevices")).VideoDevices;
}

describe("VideoDevices", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shares and caches device enumeration", async () => {
    const { mediaDevices } = installMediaDevices();
    const videoDevices = await loadVideoDevices();

    const firstRequest = videoDevices.getDevices();
    const secondRequest = videoDevices.getDevices();

    await expect(firstRequest).resolves.toEqual([expect.objectContaining({ deviceId: "one" })]);
    await expect(secondRequest).resolves.toEqual([expect.objectContaining({ deviceId: "one" })]);
    expect(mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    expect(mediaDevices.enumerateDevices).toHaveBeenCalledOnce();
    expect(videoDevices.state).toBe("ready");
  });

  it("refreshes the cached device list explicitly", async () => {
    const { mediaDevices } = installMediaDevices();
    const videoDevices = await loadVideoDevices();
    await videoDevices.getDevices();
    mediaDevices.enumerateDevices.mockResolvedValueOnce([createDevice("two")]);

    await expect(videoDevices.refreshDevices()).resolves.toEqual([
      expect.objectContaining({ deviceId: "two" }),
    ]);
    expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(2);
  });

  it("invalidates the cache after a device change", async () => {
    const { mediaDevices, signalDeviceChange } = installMediaDevices();
    const videoDevices = await loadVideoDevices();
    const listener = vi.fn();
    const unsubscribe = videoDevices.subscribe(listener);
    await videoDevices.getDevices();
    mediaDevices.enumerateDevices.mockResolvedValueOnce([createDevice("two")]);

    signalDeviceChange();

    expect(videoDevices.state).toBe("none");
    expect(listener).toHaveBeenCalledOnce();
    await expect(videoDevices.getDevices()).resolves.toEqual([
      expect.objectContaining({ deviceId: "two" }),
    ]);
    expect(mediaDevices.enumerateDevices).toHaveBeenCalledTimes(2);

    unsubscribe();
    signalDeviceChange();
    expect(listener).toHaveBeenCalledOnce();
  });

  it("clears a failed initialization so it can be retried", async () => {
    const { mediaDevices } = installMediaDevices();
    mediaDevices.getUserMedia.mockRejectedValueOnce(new Error("Permission denied"));
    const videoDevices = await loadVideoDevices();

    await expect(videoDevices.getDevices()).rejects.toThrow("Permission denied");
    expect(videoDevices.state).toBe("none");

    await expect(videoDevices.getDevices()).resolves.toHaveLength(1);
    expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    expect(videoDevices.state).toBe("ready");
  });

  it("rejects an already-aborted request without enumerating", async () => {
    const { mediaDevices } = installMediaDevices();
    const videoDevices = await loadVideoDevices();
    const abortController = new AbortController();
    abortController.abort();

    await expect(videoDevices.getDevices(abortController.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });
});
