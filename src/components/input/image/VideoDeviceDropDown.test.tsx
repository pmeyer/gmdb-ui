import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
    VideoDeviceDropDown,
    type VideoDeviceChangeHandler,
} from "./VideoDeviceDropDown";

vi.mock("@mui/material/FormControl", () => ({
    default: function MockFormControl({children}: {children?: ReactNode}) {
        return <div>{children}</div>;
    },
}));

vi.mock("@mui/material/InputLabel", () => ({
    default: function MockInputLabel({children, id}: {children?: ReactNode; id?: string}) {
        return <span id={id}>{children}</span>;
    },
}));

vi.mock("@mui/material/MenuItem", () => ({
    default: function MockMenuItem({children, value}: {children?: ReactNode; value?: string}) {
        return <option value={value}>{children}</option>;
    },
}));

vi.mock("@mui/material/Select", () => ({
    default: function MockSelect({
        children,
        disabled,
        labelId,
        onChange,
        renderValue,
        value = "",
    }: {
        children?: ReactNode;
        disabled?: boolean;
        labelId?: string;
        onChange?: (event: {target: {value: string}}) => void;
        renderValue?: (value: string) => ReactNode;
        value?: string;
    }) {
        return (
            <div>
                <select
                    aria-labelledby={labelId}
                    disabled={disabled}
                    onChange={(event) => onChange?.({target: {value: event.target.value}})}
                    value={value}
                >
                    {children}
                </select>
                <span data-testid="selected-camera">{renderValue?.(value)}</span>
            </div>
        );
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

function createChangeHandler() {
    const handler = vi.fn<VideoDeviceChangeHandler>();
    handler.mockResolvedValue(undefined);
    return handler;
}

describe("VideoDeviceDropDown", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        vi.spyOn(console, "log").mockImplementation(() => undefined);
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("selects the first available camera during initialization", async () => {
        const firstCamera = createDevice("one");
        const secondCamera = createDevice("two");
        const onCameraChange = createChangeHandler();

        render(
            <VideoDeviceDropDown
                cameraDevices={[firstCamera, secondCamera]}
                onCameraChange={onCameraChange}
            />,
        );

        const select = screen.getByRole("combobox", {name: "Camera"});
        await waitFor(() => {
            expect(onCameraChange).toHaveBeenCalledWith(firstCamera, "initial");
            expect(select).toHaveValue("one");
        });
        expect(screen.getByTestId("selected-camera")).toHaveTextContent("Camera one");
    });

    it("honors an explicitly provided initial camera", async () => {
        const firstCamera = createDevice("one");
        const secondCamera = createDevice("two");
        const onCameraChange = createChangeHandler();
        render(
            <VideoDeviceDropDown
                cameraDevices={[firstCamera, secondCamera]}
                initialCamera={secondCamera}
                onCameraChange={onCameraChange}
            />,
        );

        await waitFor(() => {
            expect(screen.getByRole("combobox", {name: "Camera"})).toHaveValue("two");
        });
        expect(onCameraChange).toHaveBeenCalledWith(secondCamera, "initial");
    });

    it("selects the only available camera during initialization even when None is allowed", async () => {
        const camera = createDevice("one");
        const onCameraChange = createChangeHandler();

        render(
            <VideoDeviceDropDown
                allowCameraNone
                cameraDevices={[camera]}
                onCameraChange={onCameraChange}
            />,
        );

        await waitFor(() => {
            expect(onCameraChange).toHaveBeenCalledWith(camera, "initial");
            expect(screen.getByRole("combobox", {name: "Camera"})).toHaveValue("one");
        });
        expect(screen.getByRole("option", {name: "None"})).toBeInTheDocument();
    });

    it("initially selects None with multiple cameras when no camera is specified", async () => {
        const firstCamera = createDevice("one");
        const secondCamera = createDevice("two");
        const onCameraChange = createChangeHandler();

        render(
            <VideoDeviceDropDown
                allowCameraNone
                cameraDevices={[firstCamera, secondCamera]}
                onCameraChange={onCameraChange}
            />,
        );

        await waitFor(() => {
            expect(onCameraChange).toHaveBeenCalledWith(null, "initial");
            expect(screen.getByRole("combobox", {name: "Camera"})).toHaveValue("");
        });
        expect(screen.getByRole("option", {name: "None"})).toBeInTheDocument();
    });

    it("commits successful user selections", async () => {
        const firstCamera = createDevice("one");
        const secondCamera = createDevice("two");
        const onCameraChange = createChangeHandler();

        render(
            <VideoDeviceDropDown
                cameraDevices={[firstCamera, secondCamera]}
                onCameraChange={onCameraChange}
            />,
        );

        const select = screen.getByRole("combobox", {name: "Camera"});
        await waitFor(() => { expect(select).toHaveValue("one"); });
        onCameraChange.mockClear();

        fireEvent.change(select, {target: {value: "two"}});

        await waitFor(() => {
            expect(onCameraChange).toHaveBeenCalledWith(secondCamera, "user");
            expect(select).toHaveValue("two");
        });
    });

    it("retains the prior selection when a user change fails", async () => {
        const firstCamera = createDevice("one");
        const secondCamera = createDevice("two");
        const onCameraChange = createChangeHandler();

        render(
            <VideoDeviceDropDown
                cameraDevices={[firstCamera, secondCamera]}
                onCameraChange={onCameraChange}
            />,
        );

        const select = screen.getByRole("combobox", {name: "Camera"});
        await waitFor(() => { expect(select).toHaveValue("one"); });
        onCameraChange.mockRejectedValueOnce(new Error("Camera unavailable"));

        fireEvent.change(select, {target: {value: "two"}});

        await waitFor(() => {
            expect(onCameraChange).toHaveBeenCalledWith(secondCamera, "user");
        });
        expect(select).toHaveValue("one");
    });

    it.each([
        {
            allowCameraNone: false,
            expectedCamera: "two",
            expectedDevice: "second" as const,
        },
        {
            allowCameraNone: true,
            expectedCamera: "",
            expectedDevice: "none" as const,
        },
    ])(
        "reconciles a removed camera to $expectedDevice through a system change",
        async ({allowCameraNone, expectedCamera, expectedDevice}) => {
            const firstCamera = createDevice("one");
            const secondCamera = createDevice("two");
            const onCameraChange = createChangeHandler();
            const {rerender} = render(
                <VideoDeviceDropDown
                    allowCameraNone={allowCameraNone}
                    cameraDevices={[firstCamera, secondCamera]}
                    initialCamera={firstCamera}
                    onCameraChange={onCameraChange}
                />,
            );

            const select = screen.getByRole("combobox", {name: "Camera"});
            await waitFor(() => { expect(select).toHaveValue("one"); });
            onCameraChange.mockClear();

            rerender(
                <VideoDeviceDropDown
                    allowCameraNone={allowCameraNone}
                    cameraDevices={[secondCamera]}
                    initialCamera={firstCamera}
                    onCameraChange={onCameraChange}
                />,
            );

            await waitFor(() => {
                expect(onCameraChange).toHaveBeenCalledWith(
                    expectedDevice === "second" ? secondCamera : null,
                    "system",
                );
                expect(select).toHaveValue(expectedCamera);
            });
        },
    );

    it("disables the control when requested or when no cameras are available", async () => {
        const camera = createDevice("one");
        const {rerender} = render(
            <VideoDeviceDropDown cameraDevices={[camera]} disabled />,
        );

        const select = screen.getByRole("combobox", {name: "Camera"});
        expect(select).toBeDisabled();

        rerender(<VideoDeviceDropDown cameraDevices={[camera]} disabled={false} />);
        await waitFor(() => { expect(select).not.toBeDisabled(); });

        rerender(<VideoDeviceDropDown cameraDevices={[]} disabled={false} />);
        expect(select).toBeDisabled();
    });

    it("uses a unique label relationship for each dropdown", () => {
        render(
            <>
                <VideoDeviceDropDown cameraDevices={[]} />
                <VideoDeviceDropDown cameraDevices={[]} />
            </>,
        );

        const selects = screen.getAllByRole("combobox", {name: "Camera"});
        const labelIds = selects.map((select) => select.getAttribute("aria-labelledby"));
        expect(labelIds[0]).not.toBe(labelIds[1]);
        expect(labelIds.every((labelId) => labelId !== null)).toBe(true);
    });
});
