import { useCallback, useEffect, useRef, useState } from "react";

import { CapturedImage } from "./support/CapturedImage";
import { VideoStream } from "./support/VideoStream";

async function getBitmap(videoStream: VideoStream) {
  const imageCapture = videoStream.getImageCapture();
  const blob = await imageCapture.takePhoto();
  return createImageBitmap(blob);
}

export interface UseImageCaptureResult {
  status: "idle" | "busy" | "complete" | "error";
  /** Hook-owned and valid until replacement, stream change, or unmount. */
  result: CapturedImage | null;
  error: Error | null;
  /** The returned capture has the same hook-owned lifetime as result. */
  takePhoto: () => Promise<CapturedImage | null>;
  /** Transfers the current result to the caller, which becomes responsible for closing it. */
  takeResult: () => CapturedImage | null;
}

interface ImageCaptureState {
  source: VideoStream | null;
  status: UseImageCaptureResult["status"];
  result: CapturedImage | null;
  error: Error | null;
}

function idleState(source: VideoStream | null): ImageCaptureState {
  return { source, status: "idle", result: null, error: null };
}

export function useImageCapture(videoStream: VideoStream | null): UseImageCaptureResult {
  const [captureState, setCaptureState] = useState<ImageCaptureState>(() =>
    idleState(videoStream),
  );
  const currentStreamRef = useRef<VideoStream | null>(videoStream);
  const nextRequestIdRef = useRef(0);
  const activeRequestIdRef = useRef<number | null>(null);
  const resultRef = useRef<CapturedImage | null>(null);

  const replaceResult = useCallback((nextResult: CapturedImage | null) => {
    const previousResult = resultRef.current;
    resultRef.current = nextResult;

    if (previousResult !== nextResult) {
      previousResult?.close();
    }
  }, []);

  useEffect(() => {
    currentStreamRef.current = videoStream;

    return () => {
      currentStreamRef.current = null;
      nextRequestIdRef.current += 1;
      activeRequestIdRef.current = null;
      replaceResult(null);
    };
  }, [replaceResult, videoStream]);

  const takePhoto = useCallback(async () => {
    if (activeRequestIdRef.current !== null) {
      return null;
    }

    if (videoStream === null) {
      const error = new Error(
        "Cannot take a photo without an active video stream",
      );
      replaceResult(null);
      setCaptureState({
        source: videoStream,
        status: "error",
        result: null,
        error,
      });
      return null;
    }

    const sourceStream = videoStream;
    const requestId = ++nextRequestIdRef.current;
    activeRequestIdRef.current = requestId;
    replaceResult(null);
    setCaptureState({
      source: sourceStream,
      status: "busy",
      result: null,
      error: null,
    });

    try {
      const bitmap = await getBitmap(sourceStream);
      const capture = new CapturedImage(bitmap);
      const isCurrentRequest =
        activeRequestIdRef.current === requestId &&
        currentStreamRef.current === sourceStream;

      if (!isCurrentRequest) {
        capture.close();
        return null;
      }

      replaceResult(capture);
      setCaptureState({
        source: sourceStream,
        status: "complete",
        result: capture,
        error: null,
      });
      return capture;
    } catch (reason: unknown) {
      const isCurrentRequest =
        activeRequestIdRef.current === requestId &&
        currentStreamRef.current === sourceStream;

      if (!isCurrentRequest) {
        return null;
      }

      const error =
        reason instanceof Error ? reason : new Error("Unable to capture image");
      replaceResult(null);
      setCaptureState({
        source: sourceStream,
        status: "error",
        result: null,
        error,
      });
      return null;
    } finally {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current = null;
      }
    }
  }, [replaceResult, videoStream]);

  const takeResult = useCallback(() => {
    const result = resultRef.current;

    if (result === null) {
      return null;
    }

    resultRef.current = null;
    setCaptureState(idleState(currentStreamRef.current));
    return result;
  }, []);

  const visibleState =
    captureState.source === videoStream ? captureState : idleState(videoStream);

  return {
    status: visibleState.status,
    result: visibleState.result,
    error: visibleState.error,
    takePhoto,
    takeResult,
  };
}
