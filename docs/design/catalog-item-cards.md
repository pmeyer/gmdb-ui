# Catalog Item Cards

## User-Facing Purpose

Catalog item cards provide the reusable visual summaries for publication-centric and song-centric browsing. They are designed for scan-friendly grids on desktop and readable stacked lists on mobile.

## Major UI Components

- `PublicationCard` presents magazine issues and book editions with cover artwork, publication metadata, transcription summary text, and optional View/Edit/Open transcription actions.
- `SongTranscriptionCard` presents a song transcription with album artwork, artists, album/source/page context, transcriber summary, and optional View/Edit actions.
- `MediaArtwork` and `CatalogCardActions` are shared card primitives for consistent artwork fallbacks and accessible action buttons.

## Routing and Navigation

No routing is introduced in this slice. Card actions are callback props so later routing or drawer/detail behavior can be attached without changing the presentation components.

## State Management

The cards are stateless presentation components. All displayed values and action handlers are supplied through typed props.

## GraphQL/API Integration

No GraphQL operations are introduced. The prop shapes represent UI-ready summary data that future GraphQL query containers can map into these components.

## Material UI Patterns

The components use MUI `Card`, `CardContent`, `CardActions`, `Chip`, `Stack`, `Typography`, and `Button`. Artwork fallback is rendered with MUI layout primitives instead of depending on external image assets.

## Accessibility and Responsive Design

Action buttons are real keyboard-focusable buttons with resource-specific `aria-label` values. Artwork and fallback panels expose descriptive image labels. Cards use flexible dimensions and responsive layout rules so they can be placed in responsive grids or single-column mobile lists.

## Known Limitations

- Cards are not yet wired into the application shell.
- Detail pages, edit flows, transcription viewing, sorting, filtering, and API loading are deferred.
- Dates are displayed as supplied by the caller; no formatting policy is introduced yet.
