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

import { AddPublicationView } from "./features/publications/AddPublicationView";
import { EditPublicationView } from "./features/publications/EditPublicationView";
import { PublicationCatalogView } from "./features/publications/PublicationCatalogView";
import { PublicationDetailView } from "./features/publications/PublicationDetailView";
import { SongCatalogView } from "./features/songs/SongCatalogView";
import { TranscriptionDetailView } from "./features/transcriptions/TranscriptionDetailView";

type CatalogView = "publications" | "songs";
type TranscriptionBackContext = "publication" | "songs";
type AppRoute =
  | {
      name: "catalog";
    }
  | {
      name: "addPublication";
    }
  | {
      name: "publicationDetail";
      publicationId: string;
    }
  | {
      name: "editPublication";
      publicationId: string;
    }
  | {
      name: "transcriptionDetail";
      publicationId: string;
      transcriptionId: string;
      backContext: TranscriptionBackContext;
    };

interface CatalogViewSwitcherProps {
  selectedView: CatalogView;
  onViewChange: (view: CatalogView) => void;
}

function readCurrentRoute(): AppRoute {
  if (/^\/publications\/add\/?$/.test(window.location.pathname)) {
    return {
      name: "addPublication",
    };
  }

  const publicationEditMatch =
    /^\/publications\/([^/]+)\/edit\/?$/.exec(window.location.pathname);

  if (publicationEditMatch !== null) {
    return {
      name: "editPublication",
      publicationId: decodeURIComponent(publicationEditMatch[1]),
    };
  }

  const transcriptionDetailMatch =
    /^\/publications\/([^/]+)\/transcriptions\/([^/]+)\/?$/.exec(
      window.location.pathname,
    );

  if (transcriptionDetailMatch !== null) {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedBackContext = searchParams.get("from");

    return {
      name: "transcriptionDetail",
      publicationId: decodeURIComponent(transcriptionDetailMatch[1]),
      transcriptionId: decodeURIComponent(transcriptionDetailMatch[2]),
      backContext: requestedBackContext === "songs" ? "songs" : "publication",
    };
  }

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

function readCurrentCatalogView(): CatalogView {
  const searchParams = new URLSearchParams(window.location.search);

  return searchParams.get("view") === "songs" ? "songs" : "publications";
}

function catalogPath(view: CatalogView) {
  return view === "songs" ? "/?view=songs" : "/";
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
  const [selectedView, setSelectedView] = useState<CatalogView>(() =>
    readCurrentCatalogView(),
  );

  useEffect(() => {
    function handlePopState() {
      const nextRoute = readCurrentRoute();

      setRoute(nextRoute);

      if (nextRoute.name === "catalog") {
        setSelectedView(readCurrentCatalogView());
      }
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateToCatalog = useCallback((view: CatalogView = "publications") => {
    pushRoute(catalogPath(view));
    setSelectedView(view);
    setRoute({ name: "catalog" });
  }, []);

  const handleViewChange = useCallback((nextView: CatalogView) => {
    setSelectedView(nextView);
    pushRoute(catalogPath(nextView));
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

  const handleAddPublication = useCallback(() => {
    setSelectedView("publications");
    pushRoute("/publications/add");
    setRoute({
      name: "addPublication",
    });
  }, []);

  const handleEditPublication = useCallback((publicationId: string) => {
    const nextPath = `/publications/${encodeURIComponent(publicationId)}/edit`;

    setSelectedView("publications");
    pushRoute(nextPath);
    setRoute({
      name: "editPublication",
      publicationId,
    });
  }, []);

  const handleTranscriptionSelected = useCallback(
    (
      publicationId: string,
      transcriptionId: string,
      backContext: TranscriptionBackContext,
    ) => {
      const nextPath = `/publications/${encodeURIComponent(
        publicationId,
      )}/transcriptions/${encodeURIComponent(transcriptionId)}${
        backContext === "songs" ? "?from=songs" : ""
      }`;

      pushRoute(nextPath);
      setRoute({
        name: "transcriptionDetail",
        publicationId,
        transcriptionId,
        backContext,
      });
    },
    [],
  );

  const handleBackFromTranscription = useCallback(() => {
    if (route.name !== "transcriptionDetail") {
      navigateToCatalog();
      return;
    }

    if (route.backContext === "songs") {
      navigateToCatalog("songs");
      return;
    }

    handlePublicationSelected(route.publicationId);
  }, [handlePublicationSelected, navigateToCatalog, route]);

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
            {route.name === "addPublication" ? (
              <AddPublicationView
                onCancel={() => {
                  navigateToCatalog("publications");
                }}
                onSaved={handlePublicationSelected}
              />
            ) : route.name === "editPublication" ? (
              <EditPublicationView
                publicationId={route.publicationId}
                onCancel={() => {
                  handlePublicationSelected(route.publicationId);
                }}
                onSaved={handlePublicationSelected}
              />
            ) : route.name === "transcriptionDetail" ? (
              <TranscriptionDetailView
                publicationId={route.publicationId}
                transcriptionId={route.transcriptionId}
                backLabel={
                  route.backContext === "songs" ? "Back to songs" : "Back to publication"
                }
                onBack={handleBackFromTranscription}
              />
            ) : route.name === "publicationDetail" ? (
              <PublicationDetailView
                publicationId={route.publicationId}
                onBackToPublications={() => {
                  navigateToCatalog("publications");
                }}
                onEditPublication={() => {
                  handleEditPublication(route.publicationId);
                }}
                onTranscriptionSelected={(transcriptionId) => {
                  handleTranscriptionSelected(
                    route.publicationId,
                    transcriptionId,
                    "publication",
                  );
                }}
              />
            ) : selectedView === "publications" ? (
              <PublicationCatalogView
                onAddPublication={handleAddPublication}
                onPublicationEditSelected={handleEditPublication}
                onPublicationSelected={handlePublicationSelected}
              />
            ) : (
              <SongCatalogView
                onTranscriptionSelected={(publicationId, transcriptionId) => {
                  handleTranscriptionSelected(
                    publicationId,
                    transcriptionId,
                    "songs",
                  );
                }}
              />
            )}
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default App;
