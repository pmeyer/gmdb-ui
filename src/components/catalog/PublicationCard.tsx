import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import coverImagePlaceholderUrl from "../../assets/cover-img-placeholder.png";
import { CatalogCardActions, MediaArtwork } from "./CatalogCardPrimitives";
import type { CatalogCardAction, PublicationCardProps } from "./types";

function isNonBlank(value: string) {
  return value.trim().length > 0;
}

function publicationTypeLabel(type: PublicationCardProps["type"]) {
  return type === "magazine" ? "Magazine issue" : "Book edition";
}

function formatTranscriptionCount(count: number) {
  return `${count.toString()} transcription${count === 1 ? "" : "s"}`;
}

function optionalValue(label: string, value: string | undefined) {
  if (value === undefined || !isNonBlank(value)) {
    return undefined;
  }

  return `${label} ${value}`;
}

function collectPublicationMetadata(publication: PublicationCardProps) {
  return [
    optionalValue("Vol.", publication.volume),
    optionalValue("Issue", publication.issue),
    optionalValue("Edition", publication.edition),
    publication.issueName,
    publication.publicationDate,
  ].filter((value): value is string => value !== undefined && isNonBlank(value));
}

function collectPublicationActions({
  title,
  onViewDetails,
  onEdit,
  onOpenTranscription,
}: PublicationCardProps) {
  const actions: CatalogCardAction[] = [];

  if (onViewDetails !== undefined) {
    actions.push({
      label: "View",
      ariaLabel: `View details for ${title}`,
      onClick: onViewDetails,
      variant: "contained",
    });
  }

  if (onEdit !== undefined) {
    actions.push({
      label: "Edit",
      ariaLabel: `Edit ${title}`,
      onClick: onEdit,
      variant: "outlined",
    });
  }

  if (onOpenTranscription !== undefined) {
    actions.push({
      label: "Open transcription",
      ariaLabel: `Open a transcription from ${title}`,
      onClick: onOpenTranscription,
      variant: "text",
    });
  }

  return actions;
}

function transcriptionSummary({
  transcriptionCount,
  transcriptionPreview,
}: PublicationCardProps) {
  const previewItems = transcriptionPreview?.filter(isNonBlank) ?? [];

  if (previewItems.length > 0) {
    return `Includes ${previewItems.slice(0, 3).join(", ")}`;
  }

  if (transcriptionCount !== undefined) {
    return formatTranscriptionCount(transcriptionCount);
  }

  return "Transcriptions not cataloged yet";
}

export function PublicationCard(publication: PublicationCardProps) {
  const metadata = collectPublicationMetadata(publication);
  const actions = collectPublicationActions(publication);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <MediaArtwork
        imageUrl={publication.coverImageUrl}
        fallbackImageUrl={coverImagePlaceholderUrl}
        altText={`Cover art for ${publication.title}`}
        fallbackLabel="No cover art"
        aspectRatio="3 / 4"
      />

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={publicationTypeLabel(publication.type)}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {publication.serialNumber !== undefined &&
              isNonBlank(publication.serialNumber) && (
                <Chip label={publication.serialNumber} size="small" variant="outlined" />
              )}
          </Stack>

          <Box>
            <Typography component="h3" variant="h6">
              {publication.title}
            </Typography>
            {metadata.length > 0 && (
              <Typography
                component="p"
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
              >
                {metadata.join(" · ")}
              </Typography>
            )}
          </Box>

          <Divider />

          <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
            {transcriptionSummary(publication)}
          </Typography>
        </Stack>
      </CardContent>

      <CatalogCardActions actions={actions} />
    </Card>
  );
}
