import type { ChangeEvent, ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { PublicationCard } from "../../components/catalog";
import type { PubSearchCriteria, PubType } from "../../graphql/generated/graphql";
import { PublicationCatalogDocument } from "./PublicationCatalogView.generated";
import { mapPublicationToCardProps } from "./publicationSummary";

interface PublicationGridProps {
  children: ReactNode;
}

interface PublicationCatalogStateProps {
  title: string;
  message: string;
}

interface PublicationsToolbarProps {
  activeFilterLabels: string[];
  canReset: boolean;
  searchDraft: string;
  typeFilter: PublicationTypeFilter;
  onClear: () => void;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onTypeFilterChange: (value: PublicationTypeFilter) => void;
}

type PublicationTypeFilter = "ALL" | PubType;

const defaultTypeFilter: PublicationTypeFilter = "ALL";

function isNonBlank(value: string) {
  return value.trim().length > 0;
}

function publicationTypeLabel(type: PubType) {
  return type === "MAG" ? "Magazines" : "Books";
}

function buildPublicationCriteria(
  searchName: string,
  typeFilter: PublicationTypeFilter,
): PubSearchCriteria {
  const criteria: PubSearchCriteria = {};
  const trimmedSearchName = searchName.trim();

  if (isNonBlank(trimmedSearchName)) {
    criteria.searchName = trimmedSearchName;
  }

  if (typeFilter !== "ALL") {
    criteria.type = typeFilter;
  }

  return criteria;
}

function PublicationGrid({ children }: PublicationGridProps) {
  return (
    <Box
      component="ul"
      sx={{
        display: "grid",
        gap: { xs: 2, sm: 2.5, lg: 3 },
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        listStyle: "none",
        m: 0,
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}

function PublicationGridItem({ children }: PublicationGridProps) {
  return (
    <Box component="li" sx={{ minWidth: 0 }}>
      {children}
    </Box>
  );
}

function PublicationCatalogState({ title, message }: PublicationCatalogStateProps) {
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

function PublicationsToolbar({
  activeFilterLabels,
  canReset,
  searchDraft,
  typeFilter,
  onClear,
  onSearchDraftChange,
  onSearchSubmit,
  onTypeFilterChange,
}: PublicationsToolbarProps) {
  const handleSearchDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onSearchDraftChange(event.target.value);
    },
    [onSearchDraftChange],
  );

  const handleSearchSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearchSubmit();
    },
    [onSearchSubmit],
  );

  const handleTypeFilterChange = useCallback(
    (event: SelectChangeEvent<PublicationTypeFilter>) => {
      onTypeFilterChange(event.target.value);
    },
    [onTypeFilterChange],
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
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", md: "flex-start" } }}
        >
          <TextField
            fullWidth
            label="Search publications"
            name="publication-search"
            onChange={handleSearchDraftChange}
            size="small"
            value={searchDraft}
          />

          <FormControl size="small" sx={{ minWidth: { md: 170 } }}>
            <InputLabel id="publication-type-filter-label">Type</InputLabel>
            <Select
              label="Type"
              labelId="publication-type-filter-label"
              onChange={handleTypeFilterChange}
              value={typeFilter}
            >
              <MenuItem value="ALL">All types</MenuItem>
              <MenuItem value="MAG">Magazines</MenuItem>
              <MenuItem value="BOOK">Books</MenuItem>
            </Select>
          </FormControl>

          <Stack
            direction={{ xs: "column", sm: "row", md: "column" }}
            spacing={1}
            sx={{
              alignItems: "stretch",
              minWidth: { md: 120 },
            }}
          >
            <Button type="submit" variant="contained">
              Search
            </Button>
            <Button disabled={!canReset} onClick={onClear} type="button" variant="text">
              Reset
            </Button>
          </Stack>
        </Stack>

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

function PublicationLoadingGrid() {
  return (
    <PublicationGrid>
      {Array.from({ length: 8 }, (_value, index) => (
        <PublicationGridItem key={index.toString()}>
          <Skeleton
            aria-label="Loading publication"
            variant="rounded"
            sx={{
              borderRadius: 2,
              height: { xs: 420, sm: 500 },
            }}
          />
        </PublicationGridItem>
      ))}
    </PublicationGrid>
  );
}

export function PublicationCatalogView() {
  const [appliedSearchName, setAppliedSearchName] = useState("");
  const [isAddPublicationNoticeOpen, setIsAddPublicationNoticeOpen] =
    useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<PublicationTypeFilter>(defaultTypeFilter);

  const criteria = useMemo(
    () => buildPublicationCriteria(appliedSearchName, typeFilter),
    [appliedSearchName, typeFilter],
  );

  const hasActiveFilters = useMemo(
    () => isNonBlank(appliedSearchName) || typeFilter !== "ALL",
    [appliedSearchName, typeFilter],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];

    if (isNonBlank(appliedSearchName)) {
      labels.push(`Search: ${appliedSearchName.trim()}`);
    }

    if (typeFilter !== "ALL") {
      labels.push(`Type: ${publicationTypeLabel(typeFilter)}`);
    }

    return labels;
  }, [appliedSearchName, typeFilter]);

  const canReset =
    hasActiveFilters || isNonBlank(searchDraft);

  const { data, error, loading } = useQuery(PublicationCatalogDocument, {
    variables: {
      criteria,
    },
  });

  const publications = useMemo(
    () =>
      data?.pubSearch.map((publication) => ({
        id: publication.id,
        cardProps: mapPublicationToCardProps(publication),
      })) ?? [],
    [data],
  );

  const handleAddPublication = useCallback(() => {
    setIsAddPublicationNoticeOpen(true);
  }, []);

  const handleCloseAddPublicationNotice = useCallback(() => {
    setIsAddPublicationNoticeOpen(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearchName(searchDraft.trim());
  }, [searchDraft]);

  const handleClear = useCallback(() => {
    setAppliedSearchName("");
    setSearchDraft("");
    setTypeFilter(defaultTypeFilter);
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
            Browse guitar magazines and song books
          </Typography>
          <Typography
            component="p"
            variant="body1"
            sx={{ color: "text.secondary", mt: 1.25 }}
          >
            Scan cataloged publications by cover, issue details, and the songs
            transcribed from each source.
          </Typography>
        </Box>

        <Button
          onClick={handleAddPublication}
          size="large"
          type="button"
          variant="contained"
          sx={{
            alignSelf: { xs: "stretch", sm: "center" },
            whiteSpace: "nowrap",
          }}
        >
          Add publication
        </Button>
      </Stack>

      <PublicationsToolbar
        activeFilterLabels={activeFilterLabels}
        canReset={canReset}
        searchDraft={searchDraft}
        typeFilter={typeFilter}
        onClear={handleClear}
        onSearchDraftChange={setSearchDraft}
        onSearchSubmit={handleSearchSubmit}
        onTypeFilterChange={setTypeFilter}
      />

      {loading && <PublicationLoadingGrid />}

      {!loading && error !== undefined && (
        <Alert severity="error" variant="outlined">
          Publications could not be loaded. Try again after the catalog API is
          available.
        </Alert>
      )}

      {!loading && error === undefined && publications.length === 0 && !hasActiveFilters && (
        <PublicationCatalogState
          title="No publications found"
          message="Cataloged magazines and books will appear here once they are added."
        />
      )}

      {!loading && error === undefined && publications.length === 0 && hasActiveFilters && (
        <PublicationCatalogState
          title="No publications match these filters"
          message="Adjust the search or publication type filter to broaden the results."
        />
      )}

      {!loading && error === undefined && publications.length > 0 && (
        <PublicationGrid>
          {publications.map((publication) => (
            <PublicationGridItem key={String(publication.id)}>
              <PublicationCard {...publication.cardProps} />
            </PublicationGridItem>
          ))}
        </PublicationGrid>
      )}

      <Snackbar
        autoHideDuration={4000}
        message="Add publication is not available yet."
        onClose={handleCloseAddPublicationNotice}
        open={isAddPublicationNoticeOpen}
      />
    </Stack>
  );
}
