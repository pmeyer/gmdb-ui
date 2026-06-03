import type { ChangeEvent, ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { SongTranscriptionCard } from "../../components/catalog";
import type { SongSearchCriteria } from "../../graphql/generated/graphql";
import { SongCatalogDocument } from "./SongCatalogView.generated";
import {
  type SongTranscriptionCatalogItem,
  mapSongsToTranscriptionCatalogItems,
} from "./songCatalogSummary";

interface SongCatalogLayoutProps {
  children: ReactNode;
}

interface SongCatalogStateProps {
  title: string;
  message: string;
}

interface SongFilters {
  titleSearch: string;
  artistSearch: string;
  albumSearch: string;
  pubNameSearch: string;
}

interface SongCatalogToolbarProps {
  activeFilterLabels: string[];
  canReset: boolean;
  draftFilters: SongFilters;
  onClear: () => void;
  onDraftFilterChange: (field: keyof SongFilters, value: string) => void;
  onSearchSubmit: () => void;
}

interface SongCatalogViewProps {
  onTranscriptionSelected?: (
    publicationId: string,
    transcriptionId: string,
  ) => void;
}

const emptySongFilters: SongFilters = {
  titleSearch: "",
  artistSearch: "",
  albumSearch: "",
  pubNameSearch: "",
};

function isNonBlank(value: string) {
  return value.trim().length > 0;
}

function buildSongCriteria(filters: SongFilters): SongSearchCriteria {
  const criteria: SongSearchCriteria = {};

  if (isNonBlank(filters.titleSearch)) {
    criteria.titleSearch = filters.titleSearch.trim();
  }

  if (isNonBlank(filters.artistSearch)) {
    criteria.artistSearch = filters.artistSearch.trim();
  }

  if (isNonBlank(filters.albumSearch)) {
    criteria.albumSearch = filters.albumSearch.trim();
  }

  if (isNonBlank(filters.pubNameSearch)) {
    criteria.pubNameSearch = filters.pubNameSearch.trim();
  }

  return criteria;
}

function activeSongFilterLabels(filters: SongFilters) {
  return [
    isNonBlank(filters.titleSearch)
      ? `Song: ${filters.titleSearch.trim()}`
      : undefined,
    isNonBlank(filters.artistSearch)
      ? `Artist: ${filters.artistSearch.trim()}`
      : undefined,
    isNonBlank(filters.albumSearch)
      ? `Album: ${filters.albumSearch.trim()}`
      : undefined,
    isNonBlank(filters.pubNameSearch)
      ? `Publication: ${filters.pubNameSearch.trim()}`
      : undefined,
  ].filter((label): label is string => label !== undefined);
}

function hasFilterValues(filters: SongFilters) {
  return Object.values(filters).some(isNonBlank);
}

function SongCatalogList({ children }: SongCatalogLayoutProps) {
  return (
    <Box
      component="ul"
      sx={{
        display: "grid",
        gap: { xs: 2, sm: 2.5 },
        gridTemplateColumns: "minmax(0, 1fr)",
        listStyle: "none",
        m: 0,
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}

function SongCatalogListItem({ children }: SongCatalogLayoutProps) {
  return (
    <Box component="li" sx={{ minWidth: 0 }}>
      {children}
    </Box>
  );
}

function SongCatalogState({ title, message }: SongCatalogStateProps) {
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

function SongCatalogLoadingList() {
  return (
    <SongCatalogList>
      {Array.from({ length: 5 }, (_value, index) => (
        <SongCatalogListItem key={index.toString()}>
          <Skeleton
            aria-label="Loading song transcription"
            variant="rounded"
            sx={{
              borderRadius: 2,
              height: { xs: 280, sm: 184 },
            }}
          />
        </SongCatalogListItem>
      ))}
    </SongCatalogList>
  );
}

function SongCatalogToolbar({
  activeFilterLabels,
  canReset,
  draftFilters,
  onClear,
  onDraftFilterChange,
  onSearchSubmit,
}: SongCatalogToolbarProps) {
  const handleSearchSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearchSubmit();
    },
    [onSearchSubmit],
  );

  const handleTitleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onDraftFilterChange("titleSearch", event.target.value);
    },
    [onDraftFilterChange],
  );

  const handleArtistSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onDraftFilterChange("artistSearch", event.target.value);
    },
    [onDraftFilterChange],
  );

  const handleAlbumSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onDraftFilterChange("albumSearch", event.target.value);
    },
    [onDraftFilterChange],
  );

  const handlePublicationSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onDraftFilterChange("pubNameSearch", event.target.value);
    },
    [onDraftFilterChange],
  );

  return (
    <Paper
      component="form"
      noValidate
      onSubmit={handleSearchSubmit}
      variant="outlined"
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr)) auto",
            },
          }}
        >
          <TextField
            fullWidth
            label="Search songs"
            name="song-title-search"
            onChange={handleTitleSearchChange}
            size="small"
            value={draftFilters.titleSearch}
          />
          <TextField
            fullWidth
            label="Artist"
            name="song-artist-search"
            onChange={handleArtistSearchChange}
            size="small"
            value={draftFilters.artistSearch}
          />
          <TextField
            fullWidth
            label="Album"
            name="song-album-search"
            onChange={handleAlbumSearchChange}
            size="small"
            value={draftFilters.albumSearch}
          />
          <TextField
            fullWidth
            label="Publication"
            name="song-publication-search"
            onChange={handlePublicationSearchChange}
            size="small"
            value={draftFilters.pubNameSearch}
          />
          <Stack
            direction={{ xs: "column", sm: "row", lg: "column" }}
            spacing={1}
            sx={{ alignItems: "stretch", minWidth: { lg: 120 } }}
          >
            <Button type="submit" variant="contained">
              Search
            </Button>
            <Button disabled={!canReset} onClick={onClear} type="button" variant="text">
              Reset
            </Button>
          </Stack>
        </Box>

        {activeFilterLabels.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography component="p" variant="body2" sx={{ color: "text.secondary" }}>
              Active filters
            </Typography>
            {activeFilterLabels.map((label) => (
              <Chip key={label} label={label} size="small" />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export function SongCatalogView({ onTranscriptionSelected }: SongCatalogViewProps) {
  const [appliedFilters, setAppliedFilters] =
    useState<SongFilters>(emptySongFilters);
  const [draftFilters, setDraftFilters] = useState<SongFilters>(emptySongFilters);
  const [notice, setNotice] = useState<string | null>(null);

  const criteria = useMemo(
    () => buildSongCriteria(appliedFilters),
    [appliedFilters],
  );

  const activeFilterLabels = useMemo(
    () => activeSongFilterLabels(appliedFilters),
    [appliedFilters],
  );

  const hasActiveFilters = useMemo(
    () => hasFilterValues(appliedFilters),
    [appliedFilters],
  );

  const canReset = hasActiveFilters || hasFilterValues(draftFilters);

  const { data, error, loading } = useQuery(SongCatalogDocument, {
    variables: {
      criteria,
    },
  });

  const transcriptions = useMemo(
    () => mapSongsToTranscriptionCatalogItems(data?.songSearch),
    [data],
  );

  const handleDraftFilterChange = useCallback(
    (field: keyof SongFilters, value: string) => {
      setDraftFilters((currentFilters) => ({
        ...currentFilters,
        [field]: value,
      }));
    },
    [],
  );

  const handleSearchSubmit = useCallback(() => {
    setAppliedFilters(draftFilters);
  }, [draftFilters]);

  const handleClear = useCallback(() => {
    setAppliedFilters(emptySongFilters);
    setDraftFilters(emptySongFilters);
  }, []);

  const handleAddSongTranscription = useCallback(() => {
    setNotice("Add song transcription is not available yet.");
  }, []);

  const handleViewTranscription = useCallback(
    (transcription: SongTranscriptionCatalogItem) => {
      if (
        onTranscriptionSelected !== undefined &&
        transcription.publicationId !== undefined
      ) {
        onTranscriptionSelected(transcription.publicationId, transcription.id);
        return;
      }

      setNotice(
        `Source publication is not cataloged for ${transcription.cardProps.title}.`,
      );
    },
    [onTranscriptionSelected],
  );

  const handleEditTranscription = useCallback(
    (transcription: SongTranscriptionCatalogItem) => {
      setNotice(
        `Edit transcription for ${transcription.cardProps.title} is not available yet.`,
      );
    },
    [],
  );

  const handleCloseNotice = useCallback(() => {
    setNotice(null);
  }, []);

  return (
    <Stack component="section" spacing={{ xs: 3, sm: 4 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 2, sm: 3 }}
        sx={{
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ maxWidth: 760 }}>
          <Typography
            id="catalog-view-heading"
            component="h2"
            variant="h4"
            sx={{
              fontSize: { xs: "1.7rem", sm: "2.125rem" },
              fontWeight: 800,
            }}
          >
            Browse song transcriptions
          </Typography>
          <Typography
            component="p"
            variant="body1"
            sx={{ color: "text.secondary", mt: 1.25 }}
          >
            Search the catalog by song, artist, album, or source publication and
            open the transcriptions attached to each result.
          </Typography>
        </Box>

        <Button
          onClick={handleAddSongTranscription}
          size="large"
          type="button"
          variant="contained"
          sx={{
            alignSelf: { xs: "stretch", sm: "center" },
            whiteSpace: "nowrap",
          }}
        >
          Add song transcription
        </Button>
      </Stack>

      <SongCatalogToolbar
        activeFilterLabels={activeFilterLabels}
        canReset={canReset}
        draftFilters={draftFilters}
        onClear={handleClear}
        onDraftFilterChange={handleDraftFilterChange}
        onSearchSubmit={handleSearchSubmit}
      />

      {loading && <SongCatalogLoadingList />}

      {!loading && error !== undefined && (
        <Alert severity="error" variant="outlined">
          Song transcriptions could not be loaded. Try again after the catalog API
          is available.
        </Alert>
      )}

      {!loading && error === undefined && transcriptions.length === 0 && !hasActiveFilters && (
        <SongCatalogState
          title="No song transcriptions found"
          message="Cataloged song transcriptions will appear here once they are added."
        />
      )}

      {!loading && error === undefined && transcriptions.length === 0 && hasActiveFilters && (
        <SongCatalogState
          title="No song transcriptions match these filters"
          message="Adjust the song, artist, album, or publication filters to broaden the results."
        />
      )}

      {!loading && error === undefined && transcriptions.length > 0 && (
        <SongCatalogList>
          {transcriptions.map((transcription) => (
            <SongCatalogListItem key={transcription.id}>
              <SongTranscriptionCard
                {...transcription.cardProps}
                onEdit={() => {
                  handleEditTranscription(transcription);
                }}
                onViewTranscription={() => {
                  handleViewTranscription(transcription);
                }}
              />
            </SongCatalogListItem>
          ))}
        </SongCatalogList>
      )}

      <Snackbar
        autoHideDuration={4000}
        key={notice}
        message={notice}
        onClose={handleCloseNotice}
        open={notice !== null}
      />
    </Stack>
  );
}
