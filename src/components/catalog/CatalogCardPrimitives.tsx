import { Box, Button, CardActions, Stack, Typography } from "@mui/material";

import type { CatalogCardAction } from "./types";

interface MediaArtworkProps {
  imageUrl?: string;
  fallbackImageUrl?: string;
  altText: string;
  fallbackLabel: string;
  aspectRatio: string;
}

interface CatalogCardActionsProps {
  actions: CatalogCardAction[];
}

function renderAction(action: CatalogCardAction) {
  return (
    <Button
      key={action.label}
      aria-label={action.ariaLabel}
      onClick={action.onClick}
      size="small"
      type="button"
      variant={action.variant}
      sx={{ textTransform: "none" }}
    >
      {action.label}
    </Button>
  );
}

export function MediaArtwork({
  imageUrl,
  fallbackImageUrl,
  altText,
  fallbackLabel,
  aspectRatio,
}: MediaArtworkProps) {
  const resolvedImageUrl =
    imageUrl !== undefined && imageUrl.trim().length > 0
      ? imageUrl
      : fallbackImageUrl;

  if (resolvedImageUrl !== undefined) {
    return (
      <Box
        component="img"
        alt={altText}
        src={resolvedImageUrl}
        sx={{
          aspectRatio,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.100",
          display: "block",
          objectFit: "cover",
          width: "100%",
        }}
      />
    );
  }

  return (
    <Stack
      role="img"
      aria-label={altText}
      sx={{
        alignItems: "center",
        aspectRatio,
        background:
          "linear-gradient(135deg, rgba(25,133,123,0.2), rgba(85,108,214,0.18))",
        borderBottom: 1,
        borderColor: "divider",
        color: "text.secondary",
        justifyContent: "center",
        p: 2,
        textAlign: "center",
      }}
    >
      <Typography
        component="span"
        variant="overline"
        sx={{ fontWeight: 800, letterSpacing: 0 }}
      >
        GMDB
      </Typography>
      <Typography component="span" variant="body2">
        {fallbackLabel}
      </Typography>
    </Stack>
  );
}

export function CatalogCardActions({ actions }: CatalogCardActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <CardActions
      sx={{
        flexWrap: "wrap",
        gap: 1,
        justifyContent: "flex-start",
        px: 2,
        py: 1.5,
        "& > :not(style) ~ :not(style)": {
          ml: 0,
        },
      }}
    >
      {actions.map(renderAction)}
    </CardActions>
  );
}
