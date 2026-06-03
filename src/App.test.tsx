import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { graphql, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

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

function publicationCatalogHandler() {
  return graphql.query("PublicationCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: publicationResults,
      },
    }),
  );
}

function publicationDetailHandler() {
  return graphql.query("PublicationDetailCatalog", () =>
    HttpResponse.json({
      data: {
        pubSearch: publicationResults,
      },
    }),
  );
}

const publicationResults = [
  {
    __typename: "PubSearchResult",
    id: "1",
    name: "Guitar World",
    type: "MAG",
    pubDate: "1992-06-01",
    serialNumber: "ISSN 1045-6295",
    pubIndexId: "11",
    details: {
      __typename: "MagDetails",
      cover: "/resources/publications/1/cover",
      volume: "12",
      issue: "4",
      issueName: "Summer Songs",
    },
    transcriptions: [
      {
        __typename: "PubTranscription",
        id: "101",
        song: {
          __typename: "Song",
          id: "201",
          title: "Little Wing",
        },
      },
    ],
  },
];

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

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

  it("navigates from a publication card to publication details", async () => {
    const user = userEvent.setup();
    server.use(publicationCatalogHandler(), publicationDetailHandler());

    renderWithProviders(<App />);

    await user.click(
      await screen.findByRole("button", {
        name: "View details for Guitar World",
      }),
    );

    expect(window.location.pathname).toBe("/publications/1");
    expect(
      await screen.findByText("Table of contents for available guitar transcriptions"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Little Wing" })).toBeInTheDocument();
  });
});
