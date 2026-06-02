import type { MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type CatalogView = "publications" | "songs";

interface CatalogViewSwitcherProps {
  selectedView: CatalogView;
  onViewChange: (view: CatalogView) => void;
}

interface CatalogModeContent {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel: string;
}

interface EmptyCatalogPanelProps {
  content: CatalogModeContent;
}

const catalogContent: Record<CatalogView, CatalogModeContent> = {
  publications: {
    eyebrow: "Publication Library",
    title: "Browse guitar magazines and song books",
    description:
      "Publication cards will collect issue details, cover art, and the transcriptions scanned from each source.",
    primaryLabel: "Magazine issues",
    secondaryLabel: "Song books",
    tertiaryLabel: "Cover art",
  },
  songs: {
    eyebrow: "Song Index",
    title: "Find songs and their available transcriptions",
    description:
      "Song rows will surface album context, artist roles, transcribers, and the publication where each transcription appears.",
    primaryLabel: "Album context",
    secondaryLabel: "Artist roles",
    tertiaryLabel: "Transcribers",
  },
};

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

function EmptyCatalogPanel({ content }: EmptyCatalogPanelProps) {
  return (
    <Paper
      component="section"
      elevation={0}
      aria-labelledby="catalog-view-heading"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.paper",
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Typography
          component="p"
          variant="overline"
          sx={{ color: "secondary.main", fontWeight: 700 }}
        >
          {content.eyebrow}
        </Typography>
        <Typography
          id="catalog-view-heading"
          component="h2"
          variant="h4"
          sx={{
            fontSize: { xs: "1.7rem", sm: "2.125rem" },
            mt: 0.5,
          }}
        >
          {content.title}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", maxWidth: 720, mt: 1.5 }}
        >
          {content.description}
        </Typography>
      </Box>

      <Divider />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          bgcolor: "grey.50",
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Chip label={content.primaryLabel} sx={{ bgcolor: "background.paper" }} />
        <Chip label={content.secondaryLabel} sx={{ bgcolor: "background.paper" }} />
        <Chip label={content.tertiaryLabel} sx={{ bgcolor: "background.paper" }} />
      </Stack>
    </Paper>
  );
}

function App() {
  const [selectedView, setSelectedView] = useState<CatalogView>("publications");

  const selectedContent = useMemo(
    () => catalogContent[selectedView],
    [selectedView],
  );

  const handleViewChange = useCallback((nextView: CatalogView) => {
    setSelectedView(nextView);
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
            <EmptyCatalogPanel content={selectedContent} />
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default App;
