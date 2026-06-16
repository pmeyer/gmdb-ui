import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PublicationCard } from "./PublicationCard";

describe("PublicationCard", () => {
  it("renders publication metadata and accessible actions", async () => {
    const user = userEvent.setup();
    const viewDetails = vi.fn();
    const edit = vi.fn();
    const openTranscription = vi.fn();

    render(
      <PublicationCard
        type="magazine"
        title="Guitar World"
        coverImageUrl="/covers/guitar-world.jpg"
        serialNumber="ISSN 1045-6295"
        volume="12"
        issue="4"
        issueName="Summer Songs"
        publicationDate="June 1992"
        transcriptionPreview={["Little Wing", "Barracuda"]}
        onViewDetails={viewDetails}
        onEdit={edit}
        onOpenTranscription={openTranscription}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Cover art for Guitar World" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Guitar World" })).toBeInTheDocument();
    expect(screen.getByText("Magazine issue")).toBeInTheDocument();
    expect(screen.getByText("ISSN 1045-6295")).toBeInTheDocument();
    expect(
      screen.getByText("Vol. 12 · Issue 4 · Summer Songs · June 1992"),
    ).toBeInTheDocument();
    expect(screen.getByText("Includes Little Wing, Barracuda")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View details for Guitar World" }));
    await user.click(screen.getByRole("button", { name: "Edit Guitar World" }));
    await user.click(
      screen.getByRole("button", {
        name: "Open a transcription from Guitar World",
      }),
    );

    expect(viewDetails).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledTimes(1);
    expect(openTranscription).toHaveBeenCalledTimes(1);
  });

  it("renders graceful fallbacks when optional publication data is missing", () => {
    render(<PublicationCard type="book" title="Collected Rock Tabs" />);

    expect(
      screen.getByRole("img", { name: "Cover art for Collected Rock Tabs" }),
    ).toHaveAttribute("src", expect.stringContaining("cover-img-placeholder.png"));
    expect(screen.getByText("Book edition")).toBeInTheDocument();
    expect(screen.getByText("Transcriptions not cataloged yet")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
