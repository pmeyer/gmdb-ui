import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import type {AspectRatio, AspectRatioNames, CapturedImage, FileWithDataUrl} from "../imageCapture";
import {ImageInput, type ImageInputProps} from "./ImageInput";

interface MockImageCaptureProps {
    width: number;
    initialAspectRatio: AspectRatioNames;
    allowCameraNone?: boolean;
    onCapture: (capture: CapturedImage) => void;
    onClose?: () => void;
}

const mocks = vi.hoisted(() => ({
    capturedImage: {
        close: vi.fn<() => void>(),
        toFile: vi.fn<(name?: string, ar?: AspectRatio) => Promise<FileWithDataUrl>>(),
    },
    fileReadToUrl: vi.fn<(file: File) => Promise<FileWithDataUrl>>(),
    imageCapture: vi.fn<(props: MockImageCaptureProps) => void>(),
}));

vi.mock("../imageCapture", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../imageCapture")>();
    return {
        ...actual,
        fileReadToUrl: mocks.fileReadToUrl,
    };
});

vi.mock("@mui/material", () => ({
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

describe("ImageInput", () => {
    beforeEach(() => {
        mocks.capturedImage.close.mockClear();
        mocks.capturedImage.toFile.mockReset();
        mocks.fileReadToUrl.mockReset();
        mocks.imageCapture.mockClear();
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
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

    it("logs capture conversion failures without emitting a new image", async () => {
        const onImageChange = vi.fn();
        const error = new Error("conversion failed");
        mocks.capturedImage.toFile.mockRejectedValue(error);

        renderImageInput({onImageChange});

        fireEvent.click(screen.getByRole("button", {name: /Capture Image/u}));
        fireEvent.click(screen.getByRole("button", {name: "Accept capture"}));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(error);
            expect(onImageChange).not.toHaveBeenCalled();
            expect(mocks.capturedImage.close).toHaveBeenCalledOnce();
            expect(screen.queryByRole("region", {name: "Camera capture"})).not.toBeInTheDocument();
        });
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
});
