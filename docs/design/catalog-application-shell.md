# Catalog Application Shell

## User-Facing Purpose

The catalog shell establishes GMDB as a personal guitar transcription reference library. It gives users a default publication-centric landing view and a clear way to switch to the song-centric browsing mode required by the functional requirements.

## Major UI Components

- `App` owns the top-level page structure and current browsing mode.
- `CatalogViewSwitcher` uses a Material UI `ToggleButtonGroup` for the Publications/Songs mode switch.
- `EmptyCatalogPanel` provides mode-specific placeholder content until real catalog data is wired.

## Routing and Navigation

No routing is introduced in this slice. The homepage renders the publication-centric view by default, and switching to Songs is local in-page navigation.

## State Management

The selected catalog mode is local React state in `App`. This keeps the shell simple while the app has no route, persistence, or API-backed view data.

## GraphQL/API Integration

No GraphQL operations are introduced. The shell avoids inventing API behavior and leaves publication and song data loading for later slices.

## Material UI Patterns

The shell uses MUI layout primitives (`Box`, `Container`, `Stack`, `Paper`) and `Typography` to follow the existing MUI theme setup. The browsing mode switch uses an exclusive, accessible `ToggleButtonGroup` with stable values for `publications` and `songs`.

## Accessibility and Responsive Design

The header uses semantic `header` and `main` regions, with real `h1` and `h2` headings. The view switcher has an explicit ARIA label and preserves selected state via MUI toggle button semantics. Layout changes from a side-by-side header on larger screens to stacked controls on mobile, keeping the switcher full-width on small screens.

## Known Limitations

- Publication and song cards are placeholders only.
- No filters, sorting, create/edit actions, routing, or transcription viewing are implemented yet.
- View selection is not encoded in the URL or persisted across sessions.
