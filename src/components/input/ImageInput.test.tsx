import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import type {AspectRatio, AspectRatioNames, CapturedImage, FileWithDataUrl} from "../imageCapture";
import {ImageInput, type ImageInputProps} from "./ImageInput";

interface MockImageCaptureProps {
    width: number;
    initialAspectRatio: AspectRatioNames;
    initialCamera?: string | MediaDeviceInfo;
    allowCameraNone?: boolean;
    onCapture: (capture: CapturedImage) => void;
    onCameraSelected?: (deviceId: string) => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
}

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason?: unknown) => void;
}

const mocks = vi.hoisted(() => ({
    capturedImage: {
        close: vi.fn<() => void>(),
        toFile: vi.fn<(name?: string, ar?: AspectRatio) => Promise<FileWithDataUrl>>(),
    },
    fileReadToUrl: vi.fn<(file: File) => Promise<FileWithDataUrl>>(),
    imageCapture: vi.fn<(props: MockImageCaptureProps) => void>(),
}));

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });

    return {promise, resolve, reject};
}

vi.mock("../imageCapture", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../imageCapture")>();
    return {
        ...actual,
        fileReadToUrl: mocks.fileReadToUrl,
    };
});

vi.mock("@mui/material", () => ({
    Alert: function MockAlert({children, onClose}: {children?: ReactNode; onClose?: () => void}) {
        return (
            <div role="alert">
                {children}
                <button aria-label="Close alert" onClick={onClose} type="button">
                    Close
                </button>
            </div>
        );
    },
    Box: function MockBox({children}: {children?: ReactNode}) {
        return <div>{children}</div>;
    },
    CardContent: function MockCardContent({children}: {children?: ReactNode}) {
        return <div>{children}</div>;
    },
    CardMedia: function MockCardMedia({alt, image}: {alt?: string; image?: string}) {
        return <img alt={alt} src={image} />;
    },
    SpeedDial: function MockSpeedDial({
        ariaLabel,
        children,
        FabProps,
        icon,
        onClose,
        onOpen,
        open,
    }: {
        ariaLabel: string;
        children?: ReactNode;
        FabProps?: {disabled?: boolean};
        icon?: ReactNode;
        onClose?: () => void;
        onOpen?: () => void;
        open?: boolean;
    }) {
        return (
            <div>
                <button
                    aria-label={ariaLabel}
                    disabled={FabProps?.disabled}
                    onClick={() => {
                        if (open === true) {
                            onClose?.();
                        } else {
                            onOpen?.();
                        }
                    }}
                    type="button"
                >
                    {icon}
                </button>
                {children}
            </div>
        );
    },
    SpeedDialAction: function MockSpeedDialAction({
        icon,
        onClick,
        slotProps,
    }: {
        icon?: ReactNode;
        onClick?: () => void;
        slotProps?: {tooltip?: {title?: string}};
    }) {
        return (
            <button onClick={onClick} type="button">
                {slotProps?.tooltip?.title}
                {icon}
            </button>
        );
    },
    SpeedDialIcon: function MockSpeedDialIcon() {
        return <span>Actions</span>;
    },
    Snackbar: function MockSnackbar({children, open}: {children?: ReactNode; open?: boolean}) {
        return open === true ? <div>{children}</div> : null;
    },
}));

vi.mock("@mui/icons-material", () => ({
    CameraAltTwoTone: function MockCameraIcon() {
        return <span aria-hidden="true">camera</span>;
    },
    DeleteTwoTone: function MockDeleteIcon() {
        return <span aria-hidden="true">delete</span>;
    },
    UploadFileTwoTone: function MockUploadIcon() {
        return <span aria-hidden="true">upload</span>;
    },
}));

vi.mock("./image/ImageCapture", () => ({
    ImageCapture: function MockImageCapture(props: MockImageCaptureProps) {
        mocks.imageCapture(props);
        return (
            <section aria-label="Camera capture">
                <button
                    onClick={() => { props.onCapture(mocks.capturedImage as unknown as CapturedImage); }}
                    type="button"
                >
                    Accept capture
                </button>
                <button
                    onClick={() => { props.onError?.(new Error("Camera permission denied")); }}
                    type="button"
                >
                    Fail camera
                </button>
                <button
                    onClick={() => { props.onCameraSelected?.("camera-two"); }}
                    type="button"
                >
                    Select camera two
                </button>
                <button onClick={props.onClose} type="button">
                    Close camera
                </button>
            </section>
        );
    },
}));

function createFileWithDataUrl(name: string, dataUrl: string): FileWithDataUrl {
    return {
        dataUrl,
        file: new File(["image"], name, {type: "image/png"}),
    };
}

function renderImageInput(props: Partial<ImageInputProps> = {}) {
    return render(
        <ImageInput
            aspectRatioName="SQUARE"
            fileBaseName="cover"
            image={undefined}
            width={200}
            {...props}
        />,
    );
}

function getFileInput(): HTMLInputElement {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput === null) {
        throw new Error("Expected file input to be rendered");
    }
    return fileInput;
}

function installCameraCaptureSupport() {
    vi.stubGlobal("ImageCapture", vi.fn());
    vi.stubGlobal("createImageBitmap", vi.fn());
    vi.stubGlobal("navigator", {
        mediaDevices: {
            enumerateDevices: vi.fn(),
            getUserMedia: vi.fn(),
        },
    });
}

function clearPreferredCameraCookie() {
    document.cookie = "gmdbPreferredCameraDeviceId=; Path=/; Max-Age=0; SameSite=Lax";
}

describe("ImageInput", () => {
    beforeEach(() => {
        installCameraCaptureSupport();
        clearPreferredCameraCookie();
        mocks.capturedImage.close.mockClear();
        mocks.capturedImage.toFile.mockReset();
        mocks.fileReadToUrl.mockReset();
        mocks.imageCapture.mockClear();
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("shows an existing image until the image is explicitly cleared", () => {
        const onImageChange = vi.fn();
        const {rerender} = renderImageInput({
            emptyImagePoster: "placeholder.png",
            existingImage: "existing.png",
            image: undefined,
            onImageChange,
        });

        expect(screen.getByAltText("Current Image")).toHaveAttribute("src", "existing.png");
        fireEvent.click(screen.getByRole("button", {name: /Clear Image/u}));

        expect(onImageChange).toHaveBeenCalledWith(null);

        rerender(
            <ImageInput
                aspectRatioName="SQUARE"
                emptyImagePoster="placeholder.png"
                existingImage="existing.png"
                fileBaseName="cover"
                image={null}
                onImageChange={onImageChange}
                width={200}
            />,
        );

        expect(screen.getByAltText("Current Image")).toHaveAttribute("src", "placeholder.png");
        expect(screen.queryByRole("button", {name: /Clear Image/u})).not.toBeInTheDocument();
    });

    it("uses a replacement image in preference to an existing image", () => {
        renderImageInput({
            existingImage: "existing.png",
            image: createFileWithDataUrl("replacement.png", "replacement-data-url"),
        });

        expect(screen.getByAltText("Current Image")).toHaveAttribute("src", "replacement-data-url");
    });

    it("emits an uploaded image file", async () => {
        const onImageChange = vi.fn();
        const uploadedFile = new File(["new image"], "uploaded.png", {type: "image/png"});
        const uploadedImage = createFileWithDataUrl("uploaded.png", "uploaded-data-url");
        mocks.fileReadToUrl.mockResolvedValue(uploadedImage);

        renderImageInput({onImageChange});

        fireEvent.change(getFileInput(), {target: {files: [uploadedFile]}});

        await waitFor(() => {
            expect(mocks.fileReadToUrl).toHaveBeenCalledWith(uploadedFile);
            expect(onImageChange).toHaveBeenCalledWith(uploadedImage);
        });
    });

    it("emits a captured image and closes the captured resource", async () => {
        const onImageChange = vi.fn();
        const capturedFile = createFileWithDataUrl("cover.png", "captured-data-url");
        mocks.capturedImage.toFile.mockResolvedValue(capturedFile);

        renderImageInput({onImageChange});

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        fireEvent.click(screen.getByRole("button", {name: "Accept capture"}));

        await waitFor(() => {
            expect(mocks.capturedImage.toFile).toHaveBeenCalledWith("cover", expect.objectContaining({commonName: "Square"}));
            expect(onImageChange).toHaveBeenCalledWith(capturedFile);
            expect(mocks.capturedImage.close).toHaveBeenCalledOnce();
            expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
        });
    });

    it("falls back to upload-only when capture conversion fails", async () => {
        const onImageChange = vi.fn();
        const error = new Error("conversion failed");
        mocks.capturedImage.toFile.mockRejectedValue(error);

        renderImageInput({onImageChange});

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        fireEvent.click(screen.getByRole("button", {name: "Accept capture"}));

        await waitFor(() => {
            expect(onImageChange).not.toHaveBeenCalled();
            expect(mocks.capturedImage.close).toHaveBeenCalledOnce();
            expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
            expect(screen.getByRole("alert")).toHaveTextContent("conversion failed");
            expect(screen.queryByRole("button", {name: /Capture Image/u})).not.toBeInTheDocument();
        });
    });

    it("hides camera capture when browser capture APIs are unavailable", () => {
        vi.unstubAllGlobals();
        vi.stubGlobal("navigator", {});

        renderImageInput();

        expect(screen.getByRole("button", {name: /Upload Image/u})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: /Capture Image/u})).not.toBeInTheDocument();
    });

    it("hides camera capture when media devices are available without still-capture globals", () => {
        vi.stubGlobal("ImageCapture", undefined);
        vi.stubGlobal("createImageBitmap", undefined);

        renderImageInput();

        expect(screen.getByRole("button", {name: /Upload Image/u})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: /Capture Image/u})).not.toBeInTheDocument();
    });

    it("shows a warning and falls back to upload-only when camera capture reports an error", async () => {
        renderImageInput();

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        fireEvent.click(screen.getByRole("button", {name: "Fail camera"}));

        await waitFor(() => {
            expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
            expect(screen.getByRole("alert")).toHaveTextContent("Camera permission denied");
            expect(screen.queryByRole("button", {name: /Capture Image/u})).not.toBeInTheDocument();
            expect(screen.getByRole("button", {name: /Upload Image/u})).toBeInTheDocument();
        });
    });

    it("remembers the selected camera for the next capture session", async () => {
        renderImageInput();

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        expect(mocks.imageCapture).toHaveBeenLastCalledWith(expect.objectContaining({
            initialCamera: undefined,
        }));

        fireEvent.click(screen.getByRole("button", {name: "Select camera two"}));
        fireEvent.click(screen.getByRole("button", {name: "Close camera"}));
        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));

        await waitFor(() => {
            expect(mocks.imageCapture).toHaveBeenLastCalledWith(expect.objectContaining({
                initialCamera: "camera-two",
            }));
        });
        expect(document.cookie).toContain("gmdbPreferredCameraDeviceId=camera-two");
    });

    it("initializes camera capture from the remembered session cookie", () => {
        document.cookie = "gmdbPreferredCameraDeviceId=camera-two; Path=/; SameSite=Lax";

        renderImageInput();
        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));

        expect(mocks.imageCapture).toHaveBeenLastCalledWith(expect.objectContaining({
            initialCamera: "camera-two",
        }));
    });

    it("closes camera capture and ignores stale actions when disabled", async () => {
        const {rerender} = renderImageInput({disabled: false});

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        expect(screen.getByRole("region", {name: "Camera capture"})).toBeInTheDocument();

        rerender(
            <ImageInput
                aspectRatioName="SQUARE"
                disabled
                fileBaseName="cover"
                image={undefined}
                width={200}
            />,
        );

        expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Image Actions"})).toBeDisabled();

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();

        rerender(
            <ImageInput
                aspectRatioName="SQUARE"
                disabled={false}
                fileBaseName="cover"
                image={undefined}
                width={200}
            />,
        );

        await waitFor(() => {
            expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
        });
    });

    it("does not emit an uploaded image that finishes after becoming disabled", async () => {
        const onImageChange = vi.fn();
        const uploadedFile = new File(["new image"], "uploaded.png", {type: "image/png"});
        const pendingUpload = deferred<FileWithDataUrl>();
        mocks.fileReadToUrl.mockReturnValue(pendingUpload.promise);
        const {rerender} = renderImageInput({onImageChange});

        fireEvent.change(getFileInput(), {target: {files: [uploadedFile]}});
        rerender(
            <ImageInput
                aspectRatioName="SQUARE"
                disabled
                fileBaseName="cover"
                image={undefined}
                onImageChange={onImageChange}
                width={200}
            />,
        );
        pendingUpload.resolve(createFileWithDataUrl("uploaded.png", "uploaded-data-url"));

        await waitFor(() => {
            expect(mocks.fileReadToUrl).toHaveBeenCalledWith(uploadedFile);
        });
        expect(onImageChange).not.toHaveBeenCalled();
    });

    it("does not emit a captured image that finishes after becoming disabled", async () => {
        const onImageChange = vi.fn();
        const pendingCapture = deferred<FileWithDataUrl>();
        mocks.capturedImage.toFile.mockReturnValue(pendingCapture.promise);
        const {rerender} = renderImageInput({onImageChange});

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        fireEvent.click(screen.getByRole("button", {name: "Accept capture"}));
        rerender(
            <ImageInput
                aspectRatioName="SQUARE"
                disabled
                fileBaseName="cover"
                image={undefined}
                onImageChange={onImageChange}
                width={200}
            />,
        );
        pendingCapture.resolve(createFileWithDataUrl("cover.png", "captured-data-url"));

        await waitFor(() => {
            expect(mocks.capturedImage.close).toHaveBeenCalledOnce();
        });
        expect(onImageChange).not.toHaveBeenCalled();
    });
});
