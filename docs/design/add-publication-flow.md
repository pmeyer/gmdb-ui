# Add Publication Flow

## Purpose

The Add Publication flow lets a user add a magazine issue or book edition from the publication-centric catalog without exposing a full database-style editor. It covers four entry paths: issue for an existing magazine, issue for a new magazine, edition for an existing book, and edition for a new book.

## UI Components

- `PublicationCatalogView` exposes the Add publication action through an optional navigation callback.
- `AddPublicationView` renders the guided form as a dedicated page.
- The form starts with a `ToggleButtonGroup` for Magazine issue versus Book edition, followed by a radio-group choice for existing versus new title.
- Existing title selection uses MUI `Autocomplete`.
- New title paths collect required title/name and serial number fields.
- Magazine issue details collect volume, issue, required issue name, publication date, and optional cover image.
- Book edition details collect edition, publication date, and optional cover image.

## Routing

The app routes `/publications/add` to `AddPublicationView`. Cancel and Back to publications return to the publication catalog. Successful saves navigate to the newly created publication detail route using the returned publication id.

## State Management

Form state is local to `AddPublicationView`. Validation runs after submit is attempted and is derived from the current publication type and source mode. No global state or URL-backed draft state is introduced.

## GraphQL Integration

The form uses real GraphQL operations colocated with the view:

- `AddPublicationIndexLookup` calls `getPubIndices(criteria: { type })` for existing magazine/book Autocomplete options.
- `AddMagazineIssue` calls `addMagazineIssue(magInput: ...)` for magazine issue saves.
- `AddBookEdition` calls `addBookEdition(bookInput: ...)` for book edition saves.

Existing publication paths submit `index: { id }`. New publication paths submit nested `index.data` with name, type, and serial. Cover image files are passed through the generated mutation input so `apollo-upload-client` can use GraphQL multipart upload handling.

## MUI Patterns

The form uses MUI `ToggleButtonGroup` for the first required type choice, `RadioGroup` for existing/new source mode, `Autocomplete` for existing publication indices, and `TextField` controls for typed metadata. The layout uses responsive CSS grid inside a single outlined `Paper` form.

## Accessibility And Responsive Design

The primary controls have explicit labels and helper text. Required fields use native required markup and inline validation messages. The form collapses to a single column on narrow viewports and keeps action buttons reachable at the bottom.

## Limitations

Initial song transcription entry is intentionally deferred. Cover image editing and cropping are also out of scope; the form only accepts the selected image file for upload.
