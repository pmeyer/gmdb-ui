import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import coverImagePlaceholderUrl from "../../assets/cover-img-placeholder.png";
import { SongTranscriptionCard } from "../../components/catalog";
import { MediaArtwork } from "../../components/catalog/CatalogCardPrimitives";
import { PublicationDetailCatalogDocument } from "./PublicationDetailView.generated";
import {
  type PublicationDetailSummary,
  type PublicationTranscriptionItem,
  mapPublicationToDetailSummary,
} from "./publicationSummary";

interface PublicationDetailViewProps {
  publicationId: string;
  onBackToPublications: () => void;
  onEditPublication: () => void;
  onTranscriptionSelected: (transcriptionId: string) => void;
}

interface PublicationMetadataListProps {
  metadata: PublicationDetailSummary["metadata"];
  serialNumber?: string;
}

interface PublicationTranscriptionListProps {
  publicationSummary: string;
  transcriptions: PublicationTranscriptionItem[];
  onViewTranscription: (transcription: PublicationTranscriptionItem) => void;
}

function PublicationDetailLoadingState() {
  return (
    <Stack spacing={3} aria-label="Loading publication details">
      <Skeleton variant="rounded" sx={{ height: { xs: 360, md: 420 } }} />
      <Skeleton variant="rounded" sx={{ height: 180 }} />
    </Stack>
  );
}

function PublicationDetailState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        p: { xs: 2.5, sm: 4 },
      }}
    >
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      <Typography component="p" variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
        {message}
      </Typography>
    </Paper>
  );
}

function PublicationMetadataList({
  metadata,
  serialNumber,
}: PublicationMetadataListProps) {
  const items = [
    serialNumber !== undefined
      ? { label: "Serial number", value: serialNumber }
      : undefined,
    ...metadata,
  ].filter(
    (item): item is PublicationDetailSummary["metadata"][number] =>
      item !== undefined,
  );

  if (items.length === 0) {
    return (
      <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
        No additional publication metadata is cataloged yet.
      </Typography>
    );
  }

  return (
    <Box
      component="dl"
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        m: 0,
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ minWidth: 0 }}>
          <Typography
            component="dt"
            variant="caption"
            sx={{ color: "text.secondary", display: "block", fontWeight: 700 }}
          >
            {item.label}
          </Typography>
          <Typography component="dd" variant="body1" sx={{ m: 0 }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function PublicationTranscriptionList({
  publicationSummary,
  transcriptions,
  onViewTranscription,
}: PublicationTranscriptionListProps) {
  if (transcriptions.length === 0) {
    return (
      <PublicationDetailState
        title="No song transcriptions listed"
        message="Songs from this publication will appear here once transcriptions are cataloged."
      />
    );
  }

  return (
    <Box
      component="ul"
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: "minmax(0, 1fr)",
        listStyle: "none",
        m: 0,
        p: 0,
      }}
    >
      {transcriptions.map((transcription) => (
        <Box component="li" key={transcription.id} sx={{ minWidth: 0 }}>
          <SongTranscriptionCard
            title={transcription.title}
            pageNumber={transcription.pageNumber}
            publicationSummary={publicationSummary}
            onViewTranscription={() => {
              onViewTranscription(transcription);
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

export function PublicationDetailView({
  publicationId,
  onBackToPublications,
  onEditPublication,
  onTranscriptionSelected,
}: PublicationDetailViewProps) {
  const parsedPublicationId = Number(publicationId);
  const { data, error, loading } = useQuery(PublicationDetailCatalogDocument, {
    skip: !Number.isInteger(parsedPublicationId),
    variables: {
      id: parsedPublicationId,
    },
  });

  const publication = data?.pubSearch[0];

  const detail = useMemo(
    () =>
      publication !== undefined
        ? mapPublicationToDetailSummary(publication)
        : undefined,
    [publication],
  );

  const handleViewTranscription = useCallback(
    (transcription: PublicationTranscriptionItem) => {
      onTranscriptionSelected(transcription.id);
    },
    [onTranscriptionSelected],
  );

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Box>
        <Button
          onClick={onBackToPublications}
          type="button"
          variant="text"
          sx={{ textTransform: "none" }}
        >
          Back to publications
        </Button>
      </Box>

      {loading && <PublicationDetailLoadingState />}

      {!loading && error !== undefined && (
        <Alert severity="error" variant="outlined">
          Publication details could not be loaded. Try again after the catalog API
          is available.
        </Alert>
      )}

      {!loading && error === undefined && detail === undefined && (
        <PublicationDetailState
          title="Publication not found"
          message="Return to the publication catalog and choose another magazine issue or book."
        />
      )}

      {!loading && error === undefined && detail !== undefined && (
        <>
          <Paper
            variant="outlined"
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: { xs: "flex", md: "grid" },
                flexDirection: "column",
                gridTemplateColumns: { md: "minmax(240px, 340px) minmax(0, 1fr)" },
              }}
            >
              <MediaArtwork
                imageUrl={detail.coverImageUrl}
                fallbackImageUrl={coverImagePlaceholderUrl}
                altText={`Cover art for ${detail.title}`}
                fallbackLabel="No cover art"
                aspectRatio="3 / 4"
              />

              <Stack spacing={3} sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Chip label={detail.typeLabel} size="small" sx={{ fontWeight: 700 }} />
                  {detail.serialNumber !== undefined && (
                    <Chip
                      label={detail.serialNumber}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>

                <Box>
                  <Typography
                    component="h2"
                    variant="h3"
                    sx={{
                      fontSize: { xs: "2rem", sm: "2.6rem" },
                      fontWeight: 800,
                      letterSpacing: 0,
                    }}
                  >
                    {detail.title}
                  </Typography>
                  <Typography
                    component="p"
                    variant="subtitle1"
                    sx={{ color: "text.secondary", mt: 1 }}
                  >
                    Table of contents for available guitar transcriptions
                  </Typography>
                </Box>

                <Divider />

                <PublicationMetadataList
                  metadata={detail.metadata}
                  serialNumber={detail.serialNumber}
                />

                <Box>
                  <Button
                    onClick={onEditPublication}
                    type="button"
                    variant="outlined"
                    sx={{ textTransform: "none" }}
                  >
                    Edit publication
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Paper>

          <Stack spacing={2}>
            <Box>
              <Typography component="h3" variant="h5" sx={{ fontWeight: 800 }}>
                Song transcriptions
              </Typography>
              <Typography
                component="p"
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.75 }}
              >
                Open a cataloged song transcription from this publication.
              </Typography>
            </Box>

            <PublicationTranscriptionList
              publicationSummary={detail.sourceSummary}
              transcriptions={detail.transcriptions}
              onViewTranscription={handleViewTranscription}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
