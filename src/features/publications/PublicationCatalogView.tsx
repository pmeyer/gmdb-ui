import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import { PublicationCard } from "../../components/catalog";
import { PublicationCatalogDocument } from "./PublicationCatalogView.generated";
import { mapPublicationToCardProps } from "./publicationSummary";

interface PublicationGridProps {
  children: ReactNode;
}

interface PublicationCatalogStateProps {
  title: string;
  message: string;
}

const defaultPublicationCriteria = {};

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
  const [isAddPublicationNoticeOpen, setIsAddPublicationNoticeOpen] =
    useState(false);

  const { data, error, loading } = useQuery(PublicationCatalogDocument, {
    variables: {
      criteria: defaultPublicationCriteria,
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

      {loading && <PublicationLoadingGrid />}

      {!loading && error !== undefined && (
        <Alert severity="error" variant="outlined">
          Publications could not be loaded. Try again after the catalog API is
          available.
        </Alert>
      )}

      {!loading && error === undefined && publications.length === 0 && (
        <PublicationCatalogState
          title="No publications found"
          message="Cataloged magazines and books will appear here once they are added."
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
