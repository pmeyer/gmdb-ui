# Add Publication Flow

## Purpose

The Add Publication flow lets a user add a magazine issue or book edition from the publication-centric catalog without exposing a full database-style editor. It supports either selecting an existing publication identity or typing a new identity for the new issue or edition.

## UI Components

- `PublicationCatalogView` exposes the Add publication action through an optional navigation callback.
- `AddPublicationView` renders the guided form as a dedicated page.
- The form starts with a `ToggleButtonGroup` for Magazine issue versus Book edition.
- Publication identity uses one free-entry MUI `Autocomplete` that can select an existing magazine/book identity or accept a new typed identity.
- Existing identity selection submits the selected publication index id and displays its serial number as read-only.
- New identity entry submits nested publication index data and requires an editable serial number.
- Magazine issue details collect volume, issue, required issue name, publication date, and optional cover image.
- Book edition details collect edition, publication date, and optional cover image.

## Routing

The app routes `/publications/add` to `AddPublicationView`. Cancel and Back to publications return to the publication catalog. Successful saves navigate to the newly created publication detail route using the returned publication id.

## State Management

Form state is local to the shared publication form. Validation runs after submit is attempted and is derived from the current publication type and whether the identity is selected from the lookup or typed as new. No global state or URL-backed draft state is introduced.

## GraphQL Integration

The form uses real GraphQL operations colocated with the view:

- `AddPublicationIndexLookup` calls `getPubIndices(criteria: { type })` for existing magazine/book Autocomplete options.
- `AddMagazineIssue` calls `addMagazineIssue(magInput: ...)` for magazine issue saves.
- `AddBookEdition` calls `addBookEdition(bookInput: ...)` for book edition saves.

Existing identity selections submit `index: { id }`. Typed new identities submit nested `index.data` with name, type, and serial. Add publication saves omit `pubId`. Cover image files are passed through the generated mutation input so `apollo-upload-client` can use GraphQL multipart upload handling.

## MUI Patterns

The form uses MUI `ToggleButtonGroup` for the first required type choice, free-entry `Autocomplete` for existing or new publication identities, and `TextField` controls for serial and typed metadata. The layout uses responsive CSS grid inside a single outlined `Paper` form.

## Accessibility And Responsive Design

The primary controls have explicit labels and helper text. Required fields use native required markup and inline validation messages. The form collapses to a single column on narrow viewports and keeps action buttons reachable at the bottom.

## Limitations

Initial song transcription entry is intentionally deferred. Cover image editing and cropping are also out of scope; the form only accepts the selected image file for upload.
