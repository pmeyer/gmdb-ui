# Building and Operating

## Tech Stack
- React + TypeScript + Material UI as the primary front-end tech stack
- `npm` will be used for package managemnt
- `Vite` to be used for front-end tooling
- Use Node v22.22.3 or newer
- GraphQL Support:
  - Use Apollo Client
  - `apollo-upload-client` for support of file uploads as part of GraphQL mutations
- Other preferred libraries:
  - `dayjs` for date/time support
  - `lodash` for support for complicated object/collection manipulation where core JS doesn't work
    - Use chained ops for multiple calls
    - Wrap objects/collections with lodash function `_(o)` to support chaining operations with final `value()` or terminating function
- Local development defaults to accessing the API on localhost:8080, but the base URL should be configurable per environment at build time

## Testing
- Use `Vitest` for unit and component tests.
- Use `React Testing Library` for React component behavior tests.
- Use `MSW` for network-level API mocking in unit/component/integration tests.
- Use `Playwright` for browser-level integration tests.

## GraphQL Code Generation
- Use GraphQL Code Generator for operation result types, operation variable types, and typed document nodes.
- Avoid generated React hooks and fragment masking unless the project explicitly adopts those patterns later.
