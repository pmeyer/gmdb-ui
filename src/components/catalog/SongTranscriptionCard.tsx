import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { CatalogCardActions, MediaArtwork } from "./CatalogCardPrimitives";
import type { CatalogCardAction, SongTranscriptionCardProps } from "./types";

function isNonBlank(value: string) {
  return value.trim().length > 0;
}

function cleanValues(values: string[] | undefined) {
  return values?.filter(isNonBlank) ?? [];
}

function formatArtists(artistNames: string[] | undefined) {
  const artists = cleanValues(artistNames);

  if (artists.length === 0) {
    return "Artist unknown";
  }

  return artists.join(", ");
}

function sourceSummary({
  publicationSummary,
  pageNumber,
}: SongTranscriptionCardProps) {
  const segments = [];

  if (publicationSummary !== undefined && isNonBlank(publicationSummary)) {
    segments.push(publicationSummary);
  }

  if (pageNumber !== undefined) {
    const formattedPageNumber = pageNumber.toString();

    if (formattedPageNumber.trim().length > 0) {
      segments.push(`Page ${formattedPageNumber}`);
    }
  }

  if (segments.length === 0) {
    return "Source publication not assigned";
  }

  return segments.join(" · ");
}

function transcriberSummary(transcribers: string[] | undefined) {
  const names = cleanValues(transcribers);

  if (names.length === 0) {
    return "Transcriber not listed";
  }

  return `Transcribed by ${names.join(", ")}`;
}

function collectSongActions({
  title,
  onViewTranscription,
  onEdit,
}: SongTranscriptionCardProps) {
  const actions: CatalogCardAction[] = [];

  if (onViewTranscription !== undefined) {
    actions.push({
      label: "View transcription",
      ariaLabel: `View transcription for ${title}`,
      onClick: onViewTranscription,
      variant: "contained",
    });
  }

  if (onEdit !== undefined) {
    actions.push({
      label: "Edit",
      ariaLabel: `Edit transcription for ${title}`,
      onClick: onEdit,
      variant: "outlined",
    });
  }

  return actions;
}

export function SongTranscriptionCard(song: SongTranscriptionCardProps) {
  const actions = collectSongActions(song);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        display: { xs: "flex", sm: "grid" },
        flexDirection: "column",
        gridTemplateColumns: { sm: "160px minmax(0, 1fr)" },
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ order: { xs: 2, sm: 0 } }}>
        <MediaArtwork
          imageUrl={song.albumArtUrl}
          altText={`Album art for ${song.albumTitle ?? song.title}`}
          fallbackLabel="No album art"
          aspectRatio="1 / 1"
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography component="h3" variant="h6">
                {song.title}
              </Typography>
              <Typography
                component="p"
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {formatArtists(song.artistNames)}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={song.albumTitle ?? "Album not listed"}
                size="small"
                sx={{ bgcolor: "grey.100" }}
              />
              <Chip label={sourceSummary(song)} size="small" variant="outlined" />
            </Stack>

            <Divider />

            <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
              {transcriberSummary(song.transcribers)}
            </Typography>
          </Stack>
        </CardContent>

        <CatalogCardActions actions={actions} />
      </Box>
    </Card>
  );
}
