# Edit Publication Flow

## Purpose

The Edit Publication flow lets a user update publication metadata for an existing magazine issue or book edition from either the publication catalog card or the publication detail page.

## UI Components

- `PublicationCard` exposes its existing optional Edit action when catalog navigation provides an edit callback.
- `PublicationDetailView` routes its Edit publication action to the edit page instead of showing a deferred notice.
- `EditPublicationView` loads the selected publication, handles loading/not-found/error states, and wraps mutation submission.
- `PublicationForm` is shared by add and edit flows so publication type controls, identity fields, issue/edition fields, date input, cover upload, validation, and action buttons stay consistent.

## Routing

The app routes `/publications/:publicationId/edit` to `EditPublicationView`. Cancel returns to the source publication detail route. A successful save navigates back to the returned publication detail route.

## State Management

Form state remains local to `PublicationForm`. `EditPublicationView` maps the loaded GraphQL publication result into the initial form state with the current publication identity selected. The publication type is displayed but disabled while editing because the current API models magazine issues and book editions through separate mutation paths.

## GraphQL Integration

Visible edit data is loaded with the existing `PublicationDetailCatalog` query using `pubSearch(criteria: { id })`.

Saves use the existing upsert-oriented API mutations:

- Magazine issues call `addMagazineIssue(magInput: ...)`.
- Book editions call `addBookEdition(bookInput: ...)`.

For edit saves, the concrete publication id is submitted as `pubId` so the API updates the existing magazine issue or book edition instead of creating another one. If the current or another existing identity is selected, the nested publication index is submitted as `index: { id }`. If a new identity is typed, the nested publication index is submitted as `index: { data: { name, serial, type } }`. Add publication saves omit `pubId`. The edit flow omits `transcriptions` so contained song transcription records are not changed by this page. Cover image files are submitted through the shared upload-capable input only when the user chooses a replacement file.

## Material UI Patterns

The shared form uses MUI `ToggleButtonGroup` for publication type, free-entry MUI `Autocomplete` for existing or new publication identity selection, `TextField` controls for serial and typed metadata, and an outlined `Paper` form surface. Existing identity selections display serial number in a disabled field; typed new identities enable serial number entry.

## Accessibility And Responsive Design

Inputs use explicit labels and inline helper or validation text. The form collapses to a single column on narrow viewports and keeps save/cancel actions grouped at the end. Disabled publication type controls keep the existing magazine/book distinction visible without implying that the type can be changed.

## Limitations

Deletion and contained song transcription editing are outside this flow. Existing cover images are retained unless a replacement file is selected.
