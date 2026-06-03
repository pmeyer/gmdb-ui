# Publication Grid

## User-Facing Purpose

The publication grid is the default homepage catalog view. It lets users browse cataloged guitar magazines and song books as visual publication cards instead of table rows, with lightweight controls for narrowing the visible catalog by supported API criteria.

## Major UI Components

- `PublicationCatalogView` owns the publication page heading, helper text, Add publication action, filter state, loading state, empty states, error state, and responsive card grid.
- `PublicationsToolbar` provides the search field, publication type filter, active filter chips, and reset action.
- `PublicationCard` remains the presentation component for each magazine issue or book edition.
- `publicationSummary.ts` maps API results into the UI-ready props expected by `PublicationCard`.

## Routing and Navigation

`App` uses local state for the Publications/Songs switcher, and Publications remains the default homepage view. The Add publication button delegates to the app shell and opens `/publications/add`, which hosts the guided Add Publication flow.

## State Management

Publication data loading is handled by Apollo `useQuery` inside `PublicationCatalogView`. Filter state is local to this view because no cross-route or shareable search requirement exists yet. Search text is kept as draft state until the form is submitted, while publication type updates the applied criteria immediately. No global state or URL state is added for publication-grid filters.

## GraphQL/API Integration

The view uses the colocated `PublicationCatalog` GraphQL operation, which calls `pubSearch(criteria: $criteria)`. The toolbar maps only supported `PubSearchCriteria` fields into the query variables:

- `searchName` for case-insensitive matching against publication index name, magazine issue name, or book edition.
- `type` for magazine versus book filtering.

Sorting controls are not implemented in this slice because the current criteria type does not expose a server-side sort option, and the view avoids inventing unsupported GraphQL arguments. The query requests publication identity, type, date, serial number, concrete publication details, cover URL, and lightweight transcription song titles for count and preview text. Relative cover URLs are passed through unchanged as opaque API resource URLs.

## Material UI Patterns

The view uses MUI `Stack`, `Box`, `Typography`, `Button`, `TextField`, `Select`, `MenuItem`, `Chip`, `Skeleton`, `Alert`, and `Paper`. The toolbar is a compact form surface with MUI form controls and chips for applied filters. The card layout uses CSS grid through MUI `Box` with responsive columns: one column on phones, two on tablets, three on medium screens, and four on large desktop.

## Accessibility and Responsive Design

The view uses a semantic section, a stable `h2` page heading, labeled text and select controls, keyboard-focusable buttons, list markup for the publication grid, and card artwork labels supplied by `PublicationCard`. Loading placeholders expose an accessible loading label. The toolbar stacks controls on narrow screens and keeps full-width touch targets for search, reset, and type filtering. The grid collapses to one column on narrow screens without changing the data model.

## Known Limitations

- Edit publication, sorting, and destructive actions are deferred.
- Sorting is specifically deferred until the GraphQL API exposes a supported sort contract.
- Transcription previews are limited to the lightweight song titles returned by `pubSearch`.
