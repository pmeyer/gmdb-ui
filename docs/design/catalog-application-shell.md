# Catalog Application Shell

## User-Facing Purpose

The catalog shell establishes GMDB as a personal guitar transcription reference library. It gives users a default publication-centric landing view and a clear way to switch to the song-centric browsing mode required by the functional requirements.

## Major UI Components

- `App` owns the top-level page structure and current browsing mode.
- `CatalogViewSwitcher` uses a Material UI `ToggleButtonGroup` for the Publications/Songs mode switch.
- `SongCatalogView` provides the API-backed Songs browsing mode.

## Routing and Navigation

No route changes are introduced for the Songs mode. The homepage renders the publication-centric view by default, and switching to Songs is local in-page navigation.

## State Management

The selected catalog mode is local React state in `App`. Publication detail routes remain synchronized with browser history, while root catalog view selection stays in page state.

## GraphQL/API Integration

The shell delegates API loading to feature views. `PublicationCatalogView`, `PublicationDetailView`, and `SongCatalogView` each own their colocated GraphQL operations and generated typed documents.

## Material UI Patterns

The shell uses MUI layout primitives (`Box`, `Container`, `Stack`, `Paper`) and `Typography` to follow the existing MUI theme setup. The browsing mode switch uses an exclusive, accessible `ToggleButtonGroup` with stable values for `publications` and `songs`.

## Accessibility and Responsive Design

The header uses semantic `header` and `main` regions, with real `h1` and `h2` headings. The view switcher has an explicit ARIA label and preserves selected state via MUI toggle button semantics. Layout changes from a side-by-side header on larger screens to stacked controls on mobile, keeping the switcher full-width on small screens.

## Known Limitations

- Create/edit actions and transcription viewing are deferred workflows.
- View selection is not encoded in the URL or persisted across sessions.
