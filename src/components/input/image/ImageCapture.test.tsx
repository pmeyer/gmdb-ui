import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {MouseEventHandler, ReactElement, ReactNode} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
    AspectRatios,
    CapturedImage,
    type UseImageCaptureResult,
    type UseMediaDeviceInfosReturn,
} from "../../imageCapture";
import {ImageCapture} from "./ImageCapture";
import type {VideoDeviceDropDownProps} from "./VideoDeviceDropDown";

const mocks = vi.hoisted(() => ({
    forDevice: vi.fn(),
    miniControlDrawer: vi.fn(),
    useImageCapture: vi.fn(),
    useMediaDeviceInfos: vi.fn(),
    videoDeviceDropDown: vi.fn(),
}));

vi.mock("../../imageCapture", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../imageCapture")>();
    return {
        ...actual,
        useImageCapture: mocks.useImageCapture,
        useMediaDeviceInfos: mocks.useMediaDeviceInfos,
        VideoStream: {forDevice: mocks.forDevice},
    };
});

vi.mock("@mui/material/Slide", () => ({
    default: function MockSlide({children, in: visible}: {
        children: ReactElement;
        in?: boolean;
    }) {
        return <div hidden={!visible}>{children}</div>;
    },
}));

vi.mock("@mui/material/Select", () => ({
    default: function MockSelect({
        children,
        disabled,
        labelId,
        onChange,
        value,
    }: {
        children?: ReactNode;
        disabled?: boolean;
        labelId?: string;
        onChange?: (event: {target: {value: string}}) => void;
        value?: string;
    }) {
        return (
            <select
                aria-labelledby={labelId}
                disabled={disabled}
                onChange={(event) => onChange?.({target: {value: event.target.value}})}
                value={value}
            >
                {children}
            </select>
        );
    },
}));

vi.mock("@mui/material/MenuItem", () => ({
    default: function MockMenuItem({children, value}: {
        children?: ReactNode;
        value?: string;
    }) {
        return <option value={value}>{children}</option>;
    },
}));

vi.mock("../util/MiniControlDrawer", () => ({
    MiniControlDrawer: function MockMiniControlDrawer(props: {
        children?: ReactNode;
        onToggle: (reason: "button") => void;
        open: boolean;
        toggleLabel: string;
    }) {
        mocks.miniControlDrawer(props);
        return (
            <section>
                <button onClick={() => { props.onToggle("button"); }} type="button">
                    {props.toggleLabel}
                </button>
                {props.open ? props.children : null}
            </section>
        );
    },
}));

vi.mock("./VideoDeviceDropDown", () => ({
    VideoDeviceDropDown: function MockVideoDeviceDropDown(props: VideoDeviceDropDownProps) {
        mocks.videoDeviceDropDown(props);
        return <div>Camera selector</div>;
    },
}));

vi.mock("../util/ZoomFab", () => ({
    ZoomFab: function MockZoomFab(props: {
        "aria-label"?: string;
        children?: ReactNode;
        disabled?: boolean;
        onClick?: MouseEventHandler<HTMLButtonElement>;
        show: boolean;
    }) {
        return props.show ? (
            <button
                aria-label={props["aria-label"]}
                disabled={props.disabled}
                onClick={props.onClick}
                type="button"
            >
                {props.children}
            </button>
        ) : null;
    },
    SemiTransparentZoomFab: function MockSemiTransparentZoomFab(props: {
        "aria-label"?: string;
        children?: ReactNode;
        onClick?: MouseEventHandler<HTMLButtonElement>;
        show: boolean;
    }) {
        return props.show ? (
            <button
                aria-label={props["aria-label"]}
                onClick={props.onClick}
                type="button"
            >
                {props.children}
            </button>
        ) : null;
    },
}));

function createDevice(deviceId: string): MediaDeviceInfo {
    return {
        deviceId,
        groupId: "group",
        kind: "videoinput",
        label: `Camera ${deviceId}`,
        toJSON: () => ({}),
    };
}

function getVideoDeviceProps(): VideoDeviceDropDownProps {
    const calls = mocks.videoDeviceDropDown.mock.calls;
    const lastCall = calls.at(-1);
    if (lastCall === undefined) {
        throw new Error("Expected the video device dropdown to be rendered");
    }
    return lastCall[0] as VideoDeviceDropDownProps;
}

function getVideoElement(): HTMLVideoElement {
    const video = document.querySelector("video");
    if (video === null) {
        throw new Error("Expected the image capture video element");
    }
    return video;
}

describe("ImageCapture", () => {
    const camera = createDevice("one");
    const mediaStream = {id: "stream-one"} as unknown as MediaStream;
    const setMaxWidth = vi.fn().mockResolvedValue(undefined);
    const primePhoto = vi.fn().mockResolvedValue(new Blob(["prime"]));
    const stop = vi.fn();
    const stream = {
        getImageCapture: () => ({takePhoto: primePhoto}),
        label: camera.label,
        setMaxWidth,
        stop,
        stream: mediaStream,
        toString: () => "VideoStream Camera one",
    };
    let takePhoto: ReturnType<typeof vi.fn<UseImageCaptureResult["takePhoto"]>>;
    let takeResult: ReturnType<typeof vi.fn<UseImageCaptureResult["takeResult"]>>;
    let play: ReturnType<typeof vi.spyOn>;
    let pause: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        takePhoto = vi.fn<UseImageCaptureResult["takePhoto"]>();
        takeResult = vi.fn<UseImageCaptureResult["takeResult"]>();
        mocks.forDevice.mockReset().mockResolvedValue(stream);
        mocks.miniControlDrawer.mockClear();
        mocks.videoDeviceDropDown.mockClear();
        mocks.useMediaDeviceInfos.mockReset().mockReturnValue({
            cameraDevices: [camera],
            message: "Found 1 camera(s)",
            status: "complete",
        } satisfies UseMediaDeviceInfosReturn);
        mocks.useImageCapture.mockReset().mockReturnValue({
            error: null,
            result: null,
            status: "idle",
            takePhoto,
            takeResult,
        } satisfies UseImageCaptureResult);
        setMaxWidth.mockClear().mockResolvedValue(undefined);
        primePhoto.mockClear().mockResolvedValue(new Blob(["prime"]));
        stop.mockClear();
        play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
        pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    async function openSettingsAndSelectCamera() {
        fireEvent.click(screen.getByRole("button", {name: "Image Capture Settings"}));
        const onCameraChange = getVideoDeviceProps().onCameraChange;
        if (onCameraChange === undefined) {
            throw new Error("Expected a camera change handler");
        }
        await act(async () => {
            await onCameraChange(camera, "initial");
        });
    }

    it("initializes a selected camera with the configured aspect ratio", async () => {
        const {container} = render(
            <ImageCapture
                initialAspectRatio="US_LETTER"
                onCapture={vi.fn()}
                width={640}
            />,
        );

        expect(mocks.videoDeviceDropDown).not.toHaveBeenCalled();
        await openSettingsAndSelectCamera();

        expect(mocks.forDevice).toHaveBeenCalledWith(camera);
        expect(setMaxWidth).toHaveBeenCalledWith(AspectRatios.US_LETTER);
        expect(primePhoto).toHaveBeenCalledOnce();
        expect(container.querySelector("video")?.srcObject).toBe(mediaStream);
    });

    it("commits successful aspect-ratio changes and retains the prior ratio on failure", async () => {
        render(
            <ImageCapture
                allowAspectRatioChange
                initialAspectRatio="US_LETTER"
                onCapture={vi.fn()}
                width={640}
            />,
        );
        await openSettingsAndSelectCamera();
        fireEvent.play(getVideoElement());

        let aspectRatioSelect = screen.getByRole("combobox", {name: "Aspect Ratio"});
        fireEvent.change(aspectRatioSelect, {target: {value: "A4"}});
        await waitFor(() => {
            expect(setMaxWidth).toHaveBeenLastCalledWith(AspectRatios.A4);
        });
        fireEvent.click(screen.getByRole("button", {name: "Image Capture Settings"}));
        aspectRatioSelect = screen.getByRole("combobox", {name: "Aspect Ratio"});
        expect(aspectRatioSelect).toHaveValue("A4");

        setMaxWidth.mockRejectedValueOnce(new Error("unsupported"));
        fireEvent.change(aspectRatioSelect, {target: {value: "SQUARE"}});
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(
                "[ICC] Failed to change aspect ratio:",
                expect.any(Error),
            );
        });
        fireEvent.click(screen.getByRole("button", {name: "Image Capture Settings"}));
        aspectRatioSelect = screen.getByRole("combobox", {name: "Aspect Ratio"});
        expect(aspectRatioSelect).toHaveValue("A4");
        expect(screen.getByRole("button", {name: "Capture image"})).not.toBeDisabled();
    });

    it("captures, previews, retakes, and transfers an accepted image", async () => {
        const close = vi.fn();
        const capture = {
            close,
            drawToCanvas: vi.fn(),
        } as unknown as CapturedImage;
        const onCapture = vi.fn();
        takePhoto.mockResolvedValue(capture);
        takeResult.mockReturnValue(capture);
        render(
            <ImageCapture
                initialAspectRatio="US_LETTER"
                onCapture={onCapture}
                width={640}
            />,
        );
        await openSettingsAndSelectCamera();
        fireEvent.play(getVideoElement());

        fireEvent.click(screen.getByRole("button", {name: "Capture image"}));
        await waitFor(() => {
            expect(screen.getByRole("button", {name: "Use captured image"})).toBeInTheDocument();
        });
        expect(pause).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", {name: "Retake image"}));
        await waitFor(() => { expect(play).toHaveBeenCalled(); });

        fireEvent.click(screen.getByRole("button", {name: "Capture image"}));
        await waitFor(() => {
            expect(screen.getByRole("button", {name: "Use captured image"})).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", {name: "Use captured image"}));

        expect(takeResult).toHaveBeenCalledOnce();
        expect(onCapture).toHaveBeenCalledWith(capture);
        expect(close).not.toHaveBeenCalled();
    });

    it("preserves the current stream when a replacement camera fails", async () => {
        render(
            <ImageCapture
                initialAspectRatio="US_LETTER"
                onCapture={vi.fn()}
                width={640}
            />,
        );
        await openSettingsAndSelectCamera();
        fireEvent.play(getVideoElement());
        const failedStream = {
            ...stream,
            setMaxWidth: vi.fn().mockRejectedValue(new Error("unsupported")),
            stop: vi.fn(),
        };
        mocks.forDevice.mockResolvedValueOnce(failedStream);
        const onCameraChange = getVideoDeviceProps().onCameraChange;
        if (onCameraChange === undefined) {
            throw new Error("Expected a camera change handler");
        }

        await expect(onCameraChange(createDevice("two"), "user")).rejects.toThrow("unsupported");

        expect(failedStream.stop).toHaveBeenCalledOnce();
        expect(stream.stop).not.toHaveBeenCalled();
        expect(screen.getByRole("button", {name: "Capture image"})).not.toBeDisabled();
    });

    it("invokes the optional close callback", () => {
        const onClose = vi.fn();
        render(
            <ImageCapture
                initialAspectRatio="US_LETTER"
                onCapture={vi.fn()}
                onClose={onClose}
                width={640}
            />,
        );

        fireEvent.click(screen.getByRole("button", {name: "Close image capture"}));
        expect(onClose).toHaveBeenCalledOnce();
    });
});
