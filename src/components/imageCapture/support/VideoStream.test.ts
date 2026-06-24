import { afterEach, describe, expect, it, vi } from "vitest";

import { VideoStream } from "./VideoStream";

interface TrackFixture {
  applyConstraints: ReturnType<typeof vi.fn>;
  settings: MediaTrackSettings;
  stop: ReturnType<typeof vi.fn>;
  track: MediaStreamTrack;
}

function createTrack(): TrackFixture {
  let constraints: MediaTrackConstraints = {};
  const settings: MediaTrackSettings = { width: 1280, height: 720 };
  const eventTarget = new EventTarget();
  const applyConstraints = vi.fn((nextConstraints: MediaTrackConstraints) => {
    constraints = nextConstraints;
    settings.width = 1920;
    settings.height = 1080;
    return Promise.resolve();
  });
  const stop = vi.fn();
  const track = Object.assign(eventTarget, {
    id: "track-one",
    label: "Camera One",
    enabled: true,
    applyConstraints,
    getCapabilities: () => ({ width: { min: 320, max: 3840 } }),
    getConstraints: () => constraints,
    getSettings: () => ({ ...settings }),
    stop,
  }) as unknown as MediaStreamTrack;

  return { applyConstraints, settings, stop, track };
}

function createStream(track: MediaStreamTrack) {
  return {
    id: "stream-one",
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
}

function installGetUserMedia(stream: MediaStream) {
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  return getUserMedia;
}

describe("VideoStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens a stream for a device and exposes its track state", async () => {
    const { track } = createTrack();
    const getUserMedia = installGetUserMedia(createStream(track));

    const videoStream = await VideoStream.forDevice("camera-one");

    expect(getUserMedia).toHaveBeenCalledWith({ video: { deviceId: "camera-one" } });
    expect(videoStream.isValid()).toBe(true);
    expect(videoStream.trackId).toBe("track-one");
    expect(videoStream.label).toBe("Camera One");
    expect(videoStream.settings).toEqual({ width: 1280, height: 720 });
  });

  it("applies constraints and refreshes settings", async () => {
    const { applyConstraints, track } = createTrack();
    installGetUserMedia(createStream(track));
    const videoStream = await VideoStream.forDevice("camera-one");

    await videoStream.setWidth(1920, "SIXTEEN_NINE");

    expect(applyConstraints).toHaveBeenCalledWith({
      width: { ideal: 1920 },
      aspectRatio: { ideal: 16 / 9 },
    });
    expect(videoStream.constraints).toEqual({
      width: { ideal: 1920 },
      aspectRatio: { ideal: 16 / 9 },
    });
    expect(videoStream.settings).toEqual({ width: 1920, height: 1080 });
  });

  it("stops and invalidates the wrapper when its track ends", async () => {
    const { stop, track } = createTrack();
    installGetUserMedia(createStream(track));
    const videoStream = await VideoStream.forDevice("camera-one");

    track.dispatchEvent(new Event("ended"));

    expect(stop).toHaveBeenCalledOnce();
    expect(videoStream.isValid()).toBe(false);
    expect(videoStream.stream).toBeNull();
    expect(videoStream.settings).toBeNull();
  });

  it("stops every supplied track if the stream has no video track", async () => {
    const stop = vi.fn();
    const audioTrack = { stop } as unknown as MediaStreamTrack;
    const stream = {
      getTracks: () => [audioTrack],
      getVideoTracks: () => [],
    } as unknown as MediaStream;
    installGetUserMedia(stream);

    await expect(VideoStream.forDevice("camera-one")).rejects.toThrow(
      "No video tracks found in stream",
    );
    expect(stop).toHaveBeenCalledOnce();
  });

  it("creates an ImageCapture only while the stream is active", async () => {
    const { track } = createTrack();
    installGetUserMedia(createStream(track));
    class MockImageCapture {
      constructor(readonly videoTrack: MediaStreamTrack) {}
    }
    vi.stubGlobal("ImageCapture", MockImageCapture);
    const videoStream = await VideoStream.forDevice("camera-one");

    expect(videoStream.getImageCapture()).toMatchObject({ videoTrack: track });

    videoStream.stop();
    expect(() => videoStream.getImageCapture()).toThrow(
      "Cannot get ImageCapture from stream without video track",
    );
  });
});
