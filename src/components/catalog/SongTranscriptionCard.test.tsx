import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SongTranscriptionCard } from "./SongTranscriptionCard";

describe("SongTranscriptionCard", () => {
  it("renders song transcription context and accessible actions", async () => {
    const user = userEvent.setup();
    const viewTranscription = vi.fn();
    const edit = vi.fn();

    render(
      <SongTranscriptionCard
        title="Little Wing"
        artistNames={["Jimi Hendrix"]}
        albumTitle="Axis: Bold as Love"
        albumArtUrl="/albums/axis.jpg"
        publicationSummary="Guitar World, June 1992"
        pageNumber={48}
        transcribers={["Jane Smith", "Pat Lee"]}
        onViewTranscription={viewTranscription}
        onEdit={edit}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Album art for Axis: Bold as Love" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Little Wing" })).toBeInTheDocument();
    expect(screen.getByText("Jimi Hendrix")).toBeInTheDocument();
    expect(screen.getByText("Axis: Bold as Love")).toBeInTheDocument();
    expect(screen.getByText("Guitar World, June 1992 · Page 48")).toBeInTheDocument();
    expect(screen.getByText("Transcribed by Jane Smith, Pat Lee")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "View transcription for Little Wing" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Edit transcription for Little Wing" }),
    );

    expect(viewTranscription).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledTimes(1);
  });

  it("renders graceful fallbacks when optional song data is missing", () => {
    render(<SongTranscriptionCard title="Untitled Draft" />);

    expect(
      screen.getByRole("img", { name: "Album art for Untitled Draft" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No album art")).toBeInTheDocument();
    expect(screen.getByText("Artist unknown")).toBeInTheDocument();
    expect(screen.getByText("Album not listed")).toBeInTheDocument();
    expect(screen.getByText("Source publication not assigned")).toBeInTheDocument();
    expect(screen.getByText("Transcriber not listed")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
