import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideoDevices } from "./support/VideoDevices";
import { useMediaDeviceInfos } from "./useMediaDeviceInfos";

vi.mock("./support/VideoDevices", () => ({
  VideoDevices: {
    getDevices: vi.fn(),
    refreshDevices: vi.fn(),
    subscribe: vi.fn(),
    state: "none",
  },
}));

function createDevice(deviceId: string) {
  return {
    deviceId,
    groupId: "group",
    kind: "videoinput",
    label: `Camera ${deviceId}`,
    toJSON: () => ({}),
  } as MediaDeviceInfo;
}

describe("useMediaDeviceInfos", () => {
  const getDevices = vi.mocked(VideoDevices.getDevices);
  const subscribe = vi.mocked(VideoDevices.subscribe);
  let deviceChangeListener: (() => void) | undefined;
  let unsubscribe = vi.fn<() => void>();

  beforeEach(() => {
    unsubscribe = vi.fn<() => void>();
    deviceChangeListener = undefined;
    getDevices.mockReset();
    subscribe.mockReset();
    subscribe.mockImplementation((listener) => {
      deviceChangeListener = listener;
      return unsubscribe;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports available cameras", async () => {
    const device = createDevice("one");
    getDevices.mockResolvedValue([device]);

    const { result } = renderHook(() => useMediaDeviceInfos());

    expect(result.current.status).toBe("loading");
    await waitFor(() => { expect(result.current.status).toBe("complete"); });
    expect(result.current.cameraDevices).toEqual([device]);
    expect(result.current.message).toBe("Found 1 camera(s)");
  });

  it("treats an empty device list as a completed request", async () => {
    getDevices.mockResolvedValue([]);

    const { result } = renderHook(() => useMediaDeviceInfos());

    await waitFor(() => { expect(result.current.status).toBe("complete"); });
    expect(result.current.cameraDevices).toEqual([]);
    expect(result.current.message).toBe("No cameras available");
  });

  it("normalizes enumeration failures", async () => {
    getDevices.mockRejectedValue("permission denied");

    const { result } = renderHook(() => useMediaDeviceInfos());

    await waitFor(() => { expect(result.current.status).toBe("error"); });
    expect(result.current.message).toBe("Error: Unable to enumerate camera devices");
    expect(result.current.cameraDevices).toEqual([]);
  });

  it("reloads and cancels the prior wait after a device change", async () => {
    const firstDevice = createDevice("one");
    const secondDevice = createDevice("two");
    const signals: AbortSignal[] = [];
    getDevices
      .mockImplementationOnce((signal) => {
        if (signal) {
          signals.push(signal);
        }
        return Promise.resolve([firstDevice]);
      })
      .mockImplementationOnce((signal) => {
        if (signal) {
          signals.push(signal);
        }
        return Promise.resolve([secondDevice]);
      });

    const { result } = renderHook(() => useMediaDeviceInfos());
    await waitFor(() => { expect(result.current.cameraDevices).toEqual([firstDevice]); });

    act(() => { deviceChangeListener?.(); });

    await waitFor(() => { expect(result.current.cameraDevices).toEqual([secondDevice]); });
    expect(signals[0]?.aborted).toBe(true);
    expect(getDevices).toHaveBeenCalledTimes(2);
  });

  it("aborts and unsubscribes without publishing an error during cleanup", () => {
    let signal: AbortSignal | undefined;
    getDevices.mockImplementation((nextSignal) => {
      signal = nextSignal;
      return new Promise<MediaDeviceInfo[]>(() => undefined);
    });
    const { result, unmount } = renderHook(() => useMediaDeviceInfos());

    unmount();

    expect(signal?.aborted).toBe(true);
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(result.current.status).toBe("loading");
  });
});
