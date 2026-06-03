# Publication Detail View

## User-Facing Purpose

The publication detail view lets a user open a magazine issue or book edition from the publication catalog and see its publication metadata alongside the song transcriptions currently cataloged from that source. The page is designed to feel like a table of contents for available guitar tabs.

## Major UI Components

- `App` now parses `/publications/:publicationId` and pushes that route when a publication card View action is used.
- `PublicationCatalogView` accepts an optional `onPublicationSelected` callback and supplies card-level View actions when navigation is available.
- `PublicationDetailView` renders the cover/placeholder, title, publication type, serial number, optional volume/issue/issue name/edition/publication date metadata, a deferred Edit publication action, and the contained transcription list.
- `publicationSummary.ts` maps GraphQL publication results into both card props and detail-view metadata so date and optional-field formatting remain consistent.

## Routing and Navigation

The slice keeps routing lightweight by using the browser History API rather than introducing a router dependency. The supported detail route is `/publications/:publicationId`. The detail page includes a Back to publications action that returns to the root catalog route. Switching the header Publications/Songs controls also returns to the root catalog route.

## State Management

Route state is local to `App` and synchronized with `popstate` so browser back/forward navigation updates the rendered view. `PublicationDetailView` owns only local Snackbar notice state for deferred edit and transcription-view actions. No global state is introduced.

## GraphQL/API Integration

The detail view uses a colocated `PublicationDetailCatalog` GraphQL operation and generated typed document. The routed publication ID is passed as the operation's only variable, `$id: Long`, and the operation maps it into `pubSearch(criteria: { id: $id })` so the backend returns only the requested magazine issue or book edition. The query requests the same real API fields currently available for publication summaries: publication identity, type, date, serial number, concrete publication details, cover URL, and transcription IDs with song titles.

## Material UI Patterns

The page uses MUI `Stack`, `Box`, `Paper`, `Typography`, `Chip`, `Button`, `Divider`, `Skeleton`, `Alert`, and `Snackbar`. The cover area reuses the existing `MediaArtwork` primitive, and transcription rows reuse `SongTranscriptionCard` with the fields available from the publication API response.

## Accessibility and Responsive Design

The detail view uses a semantic section, a stable `h2` publication heading, labeled cover artwork, keyboard-focusable Back/Edit/View transcription buttons, definition-list markup for metadata, and list markup for transcriptions. The header layout stacks on narrow screens and switches to a cover-plus-metadata grid on wider screens. Loading, error, empty transcription, and publication-not-found states are visible and screen-reader discoverable.

## Known Limitations

- Edit publication is a visible placeholder only.
- Transcription PDF/detail viewing is a visible placeholder only.
- The API response currently provides transcription IDs and song titles but not page numbers, transcribers, artist roles, album context, or PDF resource URLs in this publication query.
