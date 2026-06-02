# Publication Grid

## User-Facing Purpose

The publication grid is the default homepage catalog view. It lets users browse cataloged guitar magazines and song books as visual publication cards instead of table rows.

## Major UI Components

- `PublicationCatalogView` owns the publication page heading, helper text, Add publication action, loading state, empty state, error state, and responsive card grid.
- `PublicationCard` remains the presentation component for each magazine issue or book edition.
- `publicationSummary.ts` maps API results into the UI-ready props expected by `PublicationCard`.

## Routing and Navigation

No route changes are introduced. `App` still uses local state for the Publications/Songs switcher, and Publications remains the default homepage view. The Add publication button is present but currently opens a deferred-workflow notice because the add form is outside this slice.

## State Management

Publication data loading is handled by Apollo `useQuery` inside `PublicationCatalogView`. The Add publication notice uses local component state. No global state or URL state is added.

## GraphQL/API Integration

The view uses the colocated `PublicationCatalog` GraphQL operation, which calls `pubSearch(criteria: {})`. The query requests publication identity, type, date, serial number, concrete publication details, cover URL, and lightweight transcription song titles for count and preview text. Relative cover URLs are passed through unchanged as opaque API resource URLs.

## Material UI Patterns

The view uses MUI `Stack`, `Box`, `Typography`, `Button`, `Skeleton`, `Alert`, `Paper`, and `Snackbar`. The card layout uses CSS grid through MUI `Box` with responsive columns: one column on phones, two on tablets, three on medium screens, and four on large desktop.

## Accessibility and Responsive Design

The view uses a semantic section, a stable `h2` page heading, keyboard-focusable buttons, list markup for the publication grid, and card artwork labels supplied by `PublicationCard`. Loading placeholders expose an accessible loading label. The grid collapses to one column on narrow screens without changing the data model.

## Known Limitations

- Add publication, edit publication, detail pages, filtering, sorting, and destructive actions are deferred.
- The initial query uses empty criteria because no filtering UI exists yet.
- Transcription previews are limited to the lightweight song titles returned by `pubSearch`.
