import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("lands on the publication-centric catalog view", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Browse guitar magazines and song books",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publications" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to the song-centric catalog view", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "Songs" }));

    expect(
      screen.getByRole("heading", {
        name: "Find songs and their available transcriptions",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Songs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
