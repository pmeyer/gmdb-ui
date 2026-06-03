# Transcription Detail Viewer

## Purpose

The transcription detail viewer lets a user open a song transcription from a
catalog card and read the transcription alongside its catalog context. The page
is designed as a music document reader: the PDF or file reference owns the main
reading area, while song, album, artist, publication, page, and transcriber
metadata stays readable in a supporting side panel.

## UI Components

- `TranscriptionDetailView` renders the detail page, loading/error/not-found
  states, the metadata panel, and the PDF/viewer area.
- `SongTranscriptionCard` actions in the publication and song catalog flows now
  navigate to the viewer when a source publication id is available.
- The metadata panel reuses the existing `MediaArtwork` catalog primitive for
  publication and album artwork fallbacks.
- The edit transcription action remains visible but deferred, with a snackbar
  placeholder until edit forms are implemented.

## Routing and Navigation

The viewer route is:

`/publications/:publicationId/transcriptions/:transcriptionId`

The application shell keeps the existing lightweight history-based router. The
route is publication-scoped because the current GraphQL schema supports
`pubSearch(criteria: { id })`, while transcription-specific search criteria are
not exposed. Song-centric navigation adds `?from=songs` so the back action can
return to the song catalog. Publication-detail navigation returns to the source
publication detail page.

## State Management

State remains local to the shell and detail component:

- `App` owns the current route and selected catalog tab.
- `TranscriptionDetailView` owns only the deferred edit snackbar state.
- Derived metadata is mapped in `transcriptionDetailSummary.ts` to keep render
  logic focused on layout.

## GraphQL/API Integration

`TranscriptionDetailView.graphql` uses the real GraphQL API through
`pubSearch(criteria: { id: $publicationId })`. It requests the publication,
matching transcriptions, song, album, song artists and roles, transcribers, page
number, and transcription URL. The component selects the routed transcription id
client-side from that publication result.

Generated operation output is committed next to the `.graphql` file following
the repository's near-operation-file codegen convention.

## Material UI Patterns

The layout uses MUI `Stack`, `Box`, `Paper`, `Chip`, `Button`, `Skeleton`,
`Alert`, and `Snackbar`. Metadata is rendered as semantic definition lists where
label/value structure matters. The PDF area uses a browser-native `iframe` and a
secondary open-in-new-tab action instead of introducing a PDF library.

## Accessibility and Responsiveness

The page uses semantic headings, explicit iframe titles, labeled loading
regions, and text alternatives for artwork. Desktop uses a two-column reader
layout with metadata beside the viewer. Mobile collapses to a single column with
metadata before the PDF area and stable minimum viewer heights.

## Known Limitations

- PDF upload is not implemented.
- Edit transcription remains a deferred action.
- The viewer depends on the browser's native PDF support and falls back to an
  open-link action when a file URL exists.
- Direct transcription lookup is not available in the current schema, so detail
  loading is publication-scoped.
