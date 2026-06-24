import {ThemeProvider, alpha, createTheme} from "@mui/material/styles";
import {fireEvent, render, screen} from "@testing-library/react";
import type {MouseEventHandler, ReactElement, ReactNode} from "react";
import {describe, expect, it, vi} from "vitest";

import {MiniControlDrawer} from "./MiniControlDrawer";

const mocks = vi.hoisted(() => ({
    slide: vi.fn(),
    tooltip: vi.fn(),
    zoomFab: vi.fn(),
}));

vi.mock("@mui/material/Slide", () => ({
    default: function MockSlide(props: {
        children: ReactElement;
        in?: boolean;
    }) {
        mocks.slide(props);
        return props.in ? props.children : null;
    },
}));

vi.mock("@mui/material/Tooltip", () => ({
    default: function MockTooltip(props: {
        children: ReactElement;
        title?: ReactNode;
    }) {
        mocks.tooltip(props);
        return props.children;
    },
}));

vi.mock("./ZoomFab", () => ({
    SemiTransparentZoomFab: function MockSemiTransparentZoomFab(props: {
        "aria-controls"?: string;
        "aria-expanded"?: boolean;
        "aria-label"?: string;
        active?: boolean;
        children?: ReactNode;
        color?: string;
        onClick?: MouseEventHandler<HTMLButtonElement>;
        show: boolean;
    }) {
        mocks.zoomFab(props);

        return props.show ? (
            <button
                aria-controls={props["aria-controls"]}
                aria-expanded={props["aria-expanded"]}
                aria-label={props["aria-label"]}
                onClick={props.onClick}
                type="button"
            >
                {props.children}
            </button>
        ) : null;
    },
}));

function getControlledElement(button: HTMLElement): HTMLElement {
    const controlledId = button.getAttribute("aria-controls");
    if (controlledId === null) {
        throw new Error("Expected the toggle to identify its controlled element");
    }

    const controlledElement = document.getElementById(controlledId);
    if (controlledElement === null) {
        throw new Error(`Expected to find controlled element '${controlledId}'`);
    }

    return controlledElement;
}

describe("MiniControlDrawer", () => {
    it("exposes its closed state and toggles from the button", () => {
        const onToggle = vi.fn();

        render(
            <MiniControlDrawer
                open={false}
                onToggle={onToggle}
                toggleLabel="Image controls"
                toggleTooltip="Show image controls"
            >
                Hidden controls
            </MiniControlDrawer>,
        );

        const button = screen.getByRole("button", {name: "Image controls"});
        expect(button).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("Hidden controls")).not.toBeInTheDocument();
        expect(screen.getByTestId("SettingsTwoToneIcon")).toBeInTheDocument();
        expect(mocks.tooltip).toHaveBeenLastCalledWith(
            expect.objectContaining({title: "Show image controls"}),
        );

        fireEvent.click(button);
        expect(onToggle).toHaveBeenCalledOnce();
        expect(onToggle).toHaveBeenCalledWith("button");
    });

    it("links the expanded toggle to its mounted content", () => {
        render(
            <MiniControlDrawer
                open
                onToggle={vi.fn()}
                toggleIcon={<span>Custom icon</span>}
                toggleLabel="Image controls"
                toggleTooltip="Show image controls"
            >
                Exposure controls
            </MiniControlDrawer>,
        );

        const button = screen.getByRole("button", {name: "Image controls"});
        const drawer = getControlledElement(button);
        expect(button).toHaveAttribute("aria-expanded", "true");
        expect(drawer).toContainElement(screen.getByText("Exposure controls"));
        expect(screen.getByText("Custom icon")).toBeInTheDocument();
        expect(mocks.tooltip).toHaveBeenLastCalledWith(
            expect.objectContaining({title: undefined}),
        );
        expect(mocks.zoomFab).toHaveBeenLastCalledWith(
            expect.objectContaining({active: true, color: "info.main"}),
        );
    });

    it("preserves its collapsed footprint and applies drawer layout styling", () => {
        const theme = createTheme();

        render(
            <ThemeProvider theme={theme}>
                <MiniControlDrawer
                    direction="row"
                    open
                    onToggle={vi.fn()}
                    spacing={2}
                    toggleLabel="Image controls"
                >
                    <span>Exposure controls</span>
                    <span>Focus controls</span>
                </MiniControlDrawer>
            </ThemeProvider>,
        );

        const button = screen.getByRole("button", {name: "Image controls"});
        const container = button.parentElement;
        const drawer = getControlledElement(button);

        expect(container).toHaveStyle({
            minHeight: `calc(${theme.spacing(2)} + 40px)`,
            position: "relative",
        });
        expect({
            borderColor: window.getComputedStyle(drawer).borderColor,
            flexDirection: window.getComputedStyle(drawer).flexDirection,
        }).toEqual({
            borderColor: alpha(theme.palette.divider, 0.23),
            flexDirection: "row",
        });
        expect(screen.getByText("Focus controls")).toHaveStyle({
            marginLeft: theme.spacing(2),
        });
        expect(mocks.slide).toHaveBeenLastCalledWith(
            expect.objectContaining({
                container,
                in: true,
                mountOnEnter: true,
                unmountOnExit: true,
            }),
        );
    });
});
