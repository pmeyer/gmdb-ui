# Song-Centric View

## User-Facing Purpose

The song-centric view lets users browse cataloged song transcriptions independently of publication. It is designed for finding a song first, then seeing album context, artist information, transcription source, page number, and transcriber credits when those fields are available.

## Major UI Components

- `SongCatalogView` owns the page heading, helper text, Add song transcription action, filter state, loading state, empty states, error state, and vertical transcription list.
- `SongCatalogToolbar` provides supported song, artist, album, and publication text filters.
- `SongTranscriptionCard` remains the shared presentation component for each flattened transcription result.
- `songCatalogSummary.ts` maps `songSearch` results into card props and flattens each song's transcription list into browseable card items.

## Routing and Navigation

No new route is introduced. The existing header `ToggleButtonGroup` switches from Publications to Songs on the root catalog route, and `App` renders `SongCatalogView` for the selected Songs mode. Existing publication detail routing remains unchanged.

## State Management

Song data loading is handled by Apollo `useQuery` inside `SongCatalogView`. Filter state is local to the view, with draft text applied only when the toolbar form is submitted. Add, view, and edit actions use local Snackbar notices because their full workflows are outside this slice.

## GraphQL/API Integration

The view uses the colocated `SongCatalog` GraphQL operation, which calls `songSearch(criteria: $criteria)` and requests song title, album title/art, direct artists, transcription page/file URL, publication source data, and transcribers. The toolbar maps only supported `SongSearchCriteria` fields:

- `titleSearch` for song title matching.
- `artistSearch` for direct song artist or album artist matching.
- `albumSearch` for album title matching.
- `pubNameSearch` for publication name matching.

The UI flattens returned songs into transcription cards and omits songs with no transcription rows from the list. Sorting is deferred because `SongSearchCriteria` does not expose a supported sort contract.

## Material UI Patterns

The view uses MUI `Stack`, `Box`, `Typography`, `Button`, `TextField`, `Chip`, `Skeleton`, `Alert`, `Paper`, and `Snackbar`. Filters are a compact form surface. The result layout is a vertical list so each transcription can show richer metadata than a dense grid would allow.

## Accessibility and Responsive Design

The view uses a semantic section, stable `h2` page heading, labeled filter text fields, keyboard-focusable buttons, and list markup for transcription results. Loading placeholders expose an accessible loading label. `SongTranscriptionCard` keeps its desktop card/list hybrid layout while ordering title, artist, metadata, and primary action before album art on narrow screens.

## Known Limitations

- Add song transcription, edit transcription, and transcription viewing are present as actions but deferred.
- The PDF viewer is not implemented.
- Sorting is deferred until the GraphQL API exposes a supported sort option for `songSearch`.
- Role-specific artist display is not expanded beyond the direct artist names supported by the current shared card.
