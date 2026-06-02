# Non-Functional Requirements

## GraphQL 

The UI will leverage the [GraphQL API](https://github.com/pmeyer/gmdb-api/blob/main/GRAPHQL_API.md) to access and manage the Guitar Music catalog.

GraphQL code generation is configured in `codegen.ts` and follows the Apollo Client recommendation for colocated operation output:
- Shared schema/common types needed by operations are generated to `src/graphql/generated/graphql.ts`.
- Application operations should be authored as `.graphql` files near the component or module that uses them.
- Operation-specific generated files are emitted next to the source `.graphql` file via the `near-operation-file` preset.
- Operation output includes `typescript-operations` types and `typed-document-node` precompiled documents, so application code should import the generated document instead of defining runtime `gql` template literals in TypeScript or TSX files.
- `npm run codegen` regenerates both shared schema types and operation-local generated files. The schema endpoint defaults to `http://localhost:8080/graphql` and can be overridden with `GRAPHQL_SCHEMA`.
- Generated files should be committed with the source operation changes so type safety is stable in CI and for developers without a running API.

## MUI Framework

MUI will be used as the UI framework for primary UI components. As such:
- MUI Autocomplete will be used in many places where selection of an existing element, or specification of a new element is required, for example:
  - Existing/new publication selection/specification
  - Existing/new song selection/specification
  - Existing/new album selection/specification
  - Existing/new artist selection/specification
  - Existing/new transcriber selection/specification

  When a new element is being supplied, additional fields may required to become enabled or displayed in order to collect the additional data associated with the new element.

- MUI Autocompletes for artists and transcribers will need to support multiple value entry.

- Per the [functional requirements around artist specification](./functional-requirements.md#artist-specification), a role-centric MUI Autocomplete should be used per song role to allow selection and specification of multiple existing or new artists.
  - When adding a new artist, the option to select the artist as a person or a band should be supported.
  - For every song, there will be 3 Autocomplete controles (1 per song-artist role).  A new artist specified in one of the song-artist role Autocompletes should become a selectable option in the Autocomplete for another song-artist role (or as an option for a primary artist of an album).

    Effectively, lookup data for artist during a data entry session, should allow add new items to be appended to the available list.

- GraphQL query operations are available for all required "lookup data" that would be used as the basis in a MUI Autocomplete.
