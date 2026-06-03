import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  CssBaseline,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { PublicationCatalogView } from "./features/publications/PublicationCatalogView";
import { PublicationDetailView } from "./features/publications/PublicationDetailView";
import { SongCatalogView } from "./features/songs/SongCatalogView";

type CatalogView = "publications" | "songs";
type AppRoute =
  | {
      name: "catalog";
    }
  | {
      name: "publicationDetail";
      publicationId: string;
    };

interface CatalogViewSwitcherProps {
  selectedView: CatalogView;
  onViewChange: (view: CatalogView) => void;
}

function readCurrentRoute(): AppRoute {
  const publicationDetailMatch =
    /^\/publications\/([^/]+)\/?$/.exec(window.location.pathname);

  if (publicationDetailMatch !== null) {
    return {
      name: "publicationDetail",
      publicationId: decodeURIComponent(publicationDetailMatch[1]),
    };
  }

  return { name: "catalog" };
}

function pushRoute(path: string) {
  window.history.pushState(null, "", path);
}

function CatalogViewSwitcher({
  selectedView,
  onViewChange,
}: CatalogViewSwitcherProps) {
  const handleViewChange = useCallback(
    (_event: MouseEvent<HTMLElement>, nextView: CatalogView | null) => {
      if (nextView !== null) {
        onViewChange(nextView);
      }
    },
    [onViewChange],
  );

  return (
    <ToggleButtonGroup
      aria-label="Catalog browsing mode"
      color="primary"
      exclusive
      fullWidth
      onChange={handleViewChange}
      value={selectedView}
      sx={{
        maxWidth: { sm: 360 },
        bgcolor: "background.paper",
        boxShadow: 1,
        "& .MuiToggleButton-root": {
          borderColor: "divider",
          flex: 1,
          py: 1.1,
          textTransform: "none",
          typography: "button",
        },
      }}
    >
      <ToggleButton value="publications">Publications</ToggleButton>
      <ToggleButton value="songs">Songs</ToggleButton>
    </ToggleButtonGroup>
  );
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => readCurrentRoute());
  const [selectedView, setSelectedView] = useState<CatalogView>("publications");

  useEffect(() => {
    function handlePopState() {
      setRoute(readCurrentRoute());
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateToCatalog = useCallback(() => {
    pushRoute("/");
    setRoute({ name: "catalog" });
  }, []);

  const handleViewChange = useCallback((nextView: CatalogView) => {
    setSelectedView(nextView);
    pushRoute("/");
    setRoute({ name: "catalog" });
  }, []);

  const handlePublicationSelected = useCallback((publicationId: string) => {
    const nextPath = `/publications/${encodeURIComponent(publicationId)}`;

    setSelectedView("publications");
    pushRoute(nextPath);
    setRoute({
      name: "publicationDetail",
      publicationId,
    });
  }, []);

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.100",
        }}
      >
        <Box
          component="header"
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: { xs: 2, sm: 3 },
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 2, sm: 3 }}
              sx={{
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  component="h1"
                  variant="h4"
                  sx={{
                    fontSize: { xs: "1.9rem", sm: "2.25rem" },
                    fontWeight: 800,
                    letterSpacing: 0,
                  }}
                >
                  GMDB
                </Typography>
                <Typography
                  component="p"
                  variant="subtitle1"
                  sx={{ color: "text.secondary", mt: 0.25 }}
                >
                  Guitar transcription catalog
                </Typography>
              </Box>

              <CatalogViewSwitcher
                selectedView={selectedView}
                onViewChange={handleViewChange}
              />
            </Stack>
          </Container>
        </Box>

        <Box component="main">
          <Container
            maxWidth="lg"
            sx={{
              py: { xs: 3, sm: 5 },
            }}
          >
            {route.name === "publicationDetail" ? (
              <PublicationDetailView
                publicationId={route.publicationId}
                onBackToPublications={navigateToCatalog}
              />
            ) : selectedView === "publications" ? (
              <PublicationCatalogView
                onPublicationSelected={handlePublicationSelected}
              />
            ) : (
              <SongCatalogView />
            )}
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default App;
