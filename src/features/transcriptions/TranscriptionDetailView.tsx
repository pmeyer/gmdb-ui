import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { MediaArtwork } from "../../components/catalog/CatalogCardPrimitives";
import { TranscriptionDetailCatalogDocument } from "./TranscriptionDetailView.generated";
import {
  type ArtistRoleGroup,
  type TranscriptionDetailSummary,
  findTranscriptionDetail,
} from "./transcriptionDetailSummary";

interface TranscriptionDetailViewProps {
  publicationId: string;
  transcriptionId: string;
  backLabel: string;
  onBack: () => void;
}

interface MetadataListProps {
  items: TranscriptionDetailSummary["publicationMetadata"];
  pageNumber?: string;
}

interface ArtistRolesProps {
  groups: ArtistRoleGroup[];
}

function TranscriptionDetailLoadingState() {
  return (
    <Stack spacing={3} aria-label="Loading transcription details">
      <Skeleton variant="rounded" sx={{ height: 96 }} />
      <Skeleton variant="rounded" sx={{ height: { xs: 560, md: 680 } }} />
    </Stack>
  );
}

function TranscriptionDetailState({
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

function MetadataList({ items, pageNumber }: MetadataListProps) {
  const allItems = [
    pageNumber !== undefined ? { label: "Page", value: pageNumber } : undefined,
    ...items,
  ].filter((item): item is MetadataListProps["items"][number] => item !== undefined);

  if (allItems.length === 0) {
    return (
      <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
        No source metadata is cataloged yet.
      </Typography>
    );
  }

  return (
    <Box component="dl" sx={{ display: "grid", gap: 1.25, m: 0 }}>
      {allItems.map((item) => (
        <Box key={item.label}>
          <Typography
            component="dt"
            variant="caption"
            sx={{ color: "text.secondary", display: "block", fontWeight: 700 }}
          >
            {item.label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0 }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function ArtistRoles({ groups }: ArtistRolesProps) {
  if (groups.length === 0) {
    return (
      <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
        Artists and roles are not cataloged yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {groups.map((group) => (
        <Box key={group.label}>
          <Typography
            component="p"
            variant="caption"
            sx={{ color: "text.secondary", display: "block", fontWeight: 700 }}
          >
            {group.label}
          </Typography>
          <Typography component="p" variant="body2">
            {group.artists.join(", ")}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function TranscriberList({ transcribers }: { transcribers: string[] }) {
  if (transcribers.length === 0) {
    return (
      <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
        Transcribers are not listed.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
      {transcribers.map((transcriber) => (
        <Chip key={transcriber} label={transcriber} size="small" />
      ))}
    </Stack>
  );
}

function AlbumPanel({ detail }: { detail: TranscriptionDetailSummary }) {
  if (detail.album === undefined) {
    return (
      <Stack spacing={1.5}>
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>
          Album
        </Typography>
        <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
          Album information is not cataloged yet.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>
        Album
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: "84px minmax(0, 1fr)",
          alignItems: "start",
        }}
      >
        <MediaArtwork
          imageUrl={detail.album.albumArtUrl}
          altText={`Album art for ${detail.album.title}`}
          fallbackLabel="No album art"
          aspectRatio="1 / 1"
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography component="p" variant="body2" sx={{ fontWeight: 700 }}>
            {detail.album.title}
          </Typography>
          {detail.album.artistName !== undefined && (
            <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
              {detail.album.artistName}
            </Typography>
          )}
          {[detail.album.releaseDate, detail.album.trackNumber !== undefined ? `Track ${detail.album.trackNumber}` : undefined]
            .filter((value): value is string => value !== undefined)
            .map((value) => (
              <Typography
                component="p"
                key={value}
                variant="caption"
                sx={{ color: "text.secondary", display: "block" }}
              >
                {value}
              </Typography>
            ))}
        </Box>
      </Box>
    </Stack>
  );
}

function PdfViewer({ detail }: { detail: TranscriptionDetailSummary }) {
  if (detail.transcriptionUrl === undefined) {
    return (
      <Stack
        sx={{
          alignItems: "center",
          bgcolor: "grey.50",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          minHeight: { xs: 420, md: 720 },
          justifyContent: "center",
          p: { xs: 3, sm: 5 },
          textAlign: "center",
        }}
      >
        <Typography component="h3" variant="h6">
          PDF not available
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: 420, mt: 1 }}
        >
          This transcription has catalog metadata, but no PDF file reference is
          available yet.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box
        component="iframe"
        src={detail.transcriptionUrl}
        title={`PDF viewer for ${detail.songTitle}`}
        sx={{
          bgcolor: "grey.50",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          display: "block",
          minHeight: { xs: 520, md: 780 },
          width: "100%",
        }}
      />
      <Button
        component="a"
        href={detail.transcriptionUrl}
        rel="noreferrer"
        target="_blank"
        type="button"
        variant="outlined"
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
      >
        Open PDF in new tab
      </Button>
    </Stack>
  );
}

export function TranscriptionDetailView({
  publicationId,
  transcriptionId,
  backLabel,
  onBack,
}: TranscriptionDetailViewProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const { data, error, loading } = useQuery(TranscriptionDetailCatalogDocument, {
    variables: {
      publicationId,
    },
  });

  const publication = data?.pubSearch[0];
  const detail = useMemo(
    () => findTranscriptionDetail(publication, transcriptionId),
    [publication, transcriptionId],
  );

  const handleEditTranscription = useCallback(() => {
    setNotice("Edit transcription is not available yet.");
  }, []);

  const handleCloseNotice = useCallback(() => {
    setNotice(null);
  }, []);

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Box>
        <Button onClick={onBack} type="button" variant="text" sx={{ textTransform: "none" }}>
          {backLabel}
        </Button>
      </Box>

      {loading && <TranscriptionDetailLoadingState />}

      {!loading && error !== undefined && (
        <Alert severity="error" variant="outlined">
          Transcription details could not be loaded. Try again after the catalog API
          is available.
        </Alert>
      )}

      {!loading && error === undefined && detail === undefined && (
        <TranscriptionDetailState
          title="Transcription not found"
          message="Return to the catalog and choose another song transcription."
        />
      )}

      {!loading && error === undefined && detail !== undefined && (
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 2, sm: 3 }}
            sx={{
              alignItems: { xs: "stretch", md: "flex-end" },
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ maxWidth: 780 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                <Chip label={detail.sourcePublicationType} size="small" />
                {detail.pageNumber !== undefined && (
                  <Chip label={`Page ${detail.pageNumber}`} size="small" variant="outlined" />
                )}
              </Stack>
              <Typography
                component="h2"
                variant="h3"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
              >
                {detail.songTitle}
              </Typography>
              <Typography
                component="p"
                variant="subtitle1"
                sx={{ color: "text.secondary", mt: 1 }}
              >
                {detail.sourcePublication}
              </Typography>
            </Box>

            <Button
              onClick={handleEditTranscription}
              type="button"
              variant="contained"
              sx={{ alignSelf: { xs: "stretch", md: "center" }, textTransform: "none" }}
            >
              Edit transcription
            </Button>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, md: 4 },
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "340px minmax(0, 1fr)" },
              alignItems: "start",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <MediaArtwork
                imageUrl={detail.sourceCoverUrl}
                altText={`Cover art for ${detail.sourcePublication}`}
                fallbackLabel="No publication art"
                aspectRatio="3 / 4"
              />
              <Stack spacing={2.5} sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack spacing={1.5}>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Source
                  </Typography>
                  <Typography component="p" variant="body2">
                    {detail.sourcePublication}
                  </Typography>
                  <MetadataList
                    items={detail.publicationMetadata}
                    pageNumber={detail.pageNumber}
                  />
                </Stack>

                <Divider />

                <AlbumPanel detail={detail} />

                <Divider />

                <Stack spacing={1.5}>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Artists
                  </Typography>
                  <ArtistRoles groups={detail.artistRoleGroups} />
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                  <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Transcribers
                  </Typography>
                  <TranscriberList transcribers={detail.transcribers} />
                </Stack>
              </Stack>
            </Paper>

            <PdfViewer detail={detail} />
          </Box>

          <Snackbar
            autoHideDuration={4000}
            key={notice}
            message={notice}
            onClose={handleCloseNotice}
            open={notice !== null}
          />
        </>
      )}
    </Stack>
  );
}
