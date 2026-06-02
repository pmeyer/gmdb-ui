import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import App from "./App";
import { server } from "./test/server";
import { renderWithProviders } from "./test/renderWithProviders";

function emptyPublicationCatalogHandler() {
  return graphql.query("PublicationCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: [],
      },
    }),
  );
}

describe("App", () => {
  it("lands on the publication-centric catalog view", async () => {
    server.use(emptyPublicationCatalogHandler());

    renderWithProviders(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Browse guitar magazines and song books",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Add publication" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Publications" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to the song-centric catalog view", async () => {
    const user = userEvent.setup();
    server.use(emptyPublicationCatalogHandler());

    renderWithProviders(<App />);

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
