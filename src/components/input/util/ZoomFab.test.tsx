import { ThemeProvider, alpha, createTheme } from "@mui/material/styles";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SemiTransparentZoomFab, ZoomFab } from "./ZoomFab";

vi.mock("@mui/material/Zoom", () => ({
  default: function MockZoom({
    children,
    in: show,
  }: {
    children: ReactNode;
    in: boolean;
  }) {
    return show ? children : null;
  },
}));

describe("ZoomFab", () => {
  it("renders and forwards Fab properties while shown", () => {
    const onClick = vi.fn();

    render(
      <ZoomFab show aria-label="Capture image" color="primary" onClick={onClick}>
        Capture
      </ZoomFab>,
    );

    const button = screen.getByRole("button", { name: "Capture image" });
    expect(button).toHaveTextContent("Capture");
    expect(button).toHaveClass("MuiFab-primary");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render its Fab while hidden", () => {
    render(
      <ZoomFab show={false} aria-label="Hidden action">
        Hidden
      </ZoomFab>,
    );

    expect(screen.queryByRole("button", { name: "Hidden action" })).not.toBeInTheDocument();
  });
});

describe("SemiTransparentZoomFab", () => {
  it("uses translucent default colors while inactive", () => {
    const theme = createTheme();

    render(
      <ThemeProvider theme={theme}>
        <SemiTransparentZoomFab aria-label="Toggle controls" show>
          Toggle
        </SemiTransparentZoomFab>
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Toggle controls" })).toHaveStyle({
      backgroundColor: alpha(theme.palette.grey[300], 0.1),
      color: alpha(theme.palette.grey[500], 0.5),
    });
  });

  it("uses a palette path for its active colors", () => {
    const theme = createTheme();
    const expectedColor = theme.palette.augmentColor({
      color: { main: theme.palette.info.main },
    });

    render(
      <ThemeProvider theme={theme}>
        <SemiTransparentZoomFab
          active
          aria-label="Toggle controls"
          color="info.main"
          show
        >
          Toggle
        </SemiTransparentZoomFab>
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: "Toggle controls" });
    expect(button).toHaveStyle({
      backgroundColor: expectedColor.dark,
      color: expectedColor.contrastText,
    });
  });

  it("uses a literal CSS color for its active colors", () => {
    const theme = createTheme();
    const expectedColor = theme.palette.augmentColor({
      color: { main: "#d32f2f" },
    });

    render(
      <ThemeProvider theme={theme}>
        <SemiTransparentZoomFab
          active
          aria-label="Toggle controls"
          color="#d32f2f"
          show
        >
          Toggle
        </SemiTransparentZoomFab>
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Toggle controls" })).toHaveStyle({
      backgroundColor: expectedColor.dark,
      color: expectedColor.contrastText,
    });
  });

  it("does not forward its styling-only properties to the Fab", () => {
    render(
      <SemiTransparentZoomFab
        active
        aria-label="Toggle controls"
        color="info.main"
        show
      >
        Toggle
      </SemiTransparentZoomFab>,
    );

    const button = screen.getByRole("button", { name: "Toggle controls" });
    expect(button).not.toHaveAttribute("active");
    expect(button).not.toHaveAttribute("color");
  });
});
