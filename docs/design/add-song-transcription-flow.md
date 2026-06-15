# Add Song Transcription Flow

## Purpose

The add song transcription flow guides a user through adding one scanned song
transcription PDF to a catalog publication. The flow starts with publication
selection because every transcription must be associated with an existing or new
magazine issue or book edition before song metadata is collected.

## UI Structure

`AddSongTranscriptionView` is a five-step Material UI stepper:

1. Publication
2. Song
3. Album
4. Transcription file and source details
5. Review and save

The catalog song view routes the `Add song transcription` action to
`/songs/transcriptions/add`. Cancel returns to the song-centric catalog. A
successful save navigates to the saved publication detail view.

## Publication Decisions

The publication step supports existing and new publication modes. Existing
publication choices come from the real `pubSearch` GraphQL query. New
publication entry mirrors the add-publication fields for magazine issues and
book editions, excluding nested transcription lists so the guided flow owns the
single transcription being added.

For saves, the flow uses the existing `addMagazineIssue` and `addBookEdition`
mutations with a single `TranscriptionInput`. When an existing publication is
selected, its current metadata is preserved from `pubSearch` and the mutation is
sent with `pubId`.

## Song, Artist, And Album Decisions

The song step supports existing songs or a new song title. New song artist entry
is role-centric: separate multi-value Autocompletes are shown for performed-by,
music-by, and words-by roles. Existing artist choices are harvested from real
`songSearch` results. New artist names are added to the current session choices
and require a person/band type selection.

Album data is optional. If supplied, the flow requires a track number and either
an existing album or a new album title. Existing album and primary artist choices
are also derived from real `songSearch` results.

## Transcription Decisions

The transcription step requires the starting page number and a PDF upload.
Transcriber entry uses a multi-value free-solo Autocomplete. Existing
transcriber choices are derived from real `songSearch` transcription results;
new transcriber names are sent as `TranscriberInput.name`.

## State And Validation

The flow keeps local state per section and validates only the current step before
moving forward. The review step displays a compact summary and provides edit
chips that jump back to each prior section.

Required validation covers publication selection or new-publication fields, new
song title, album track/title requirements when album mode is enabled, starting
page number, and PDF selection.

## Material UI, Accessibility, And Responsiveness

The flow uses MUI Stepper, ToggleButtonGroup, Autocomplete, TextField, Select,
Chip, Button, Paper, and Alert components. Step labels are visible as a full
stepper on desktop and as a compact current-step label on smaller screens.
Form controls use explicit labels, required states, helper text, and validation
messages. Layouts use responsive grids and stacks to avoid wide nested form
sections on mobile.

## Known Limitations

The generated GraphQL schema exposes `pubSearch` and `songSearch`, but not
dedicated artist, album, or transcriber lookup queries. This slice therefore
uses existing values present in real `songSearch` results for those lookup
Autocompletes. Broader lookup coverage should move to dedicated schema-backed
queries if the API adds them.

The flow does not implement OCR, bulk import, advanced duplicate detection, or
post-save transcription-detail routing.
