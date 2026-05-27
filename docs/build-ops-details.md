# Building and Operating

## Tech Stack
- React + TypeScript + Material UI as the primary front-end tech stack
- `npm` will be used for package management
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

## API Routing
- Application code should use relative API URLs, such as `/graphql`.
- In local development, Vite proxies relative API requests to `VITE_API_BASE_URL`, which defaults to `http://localhost:8080`.
- In production, the web app and API are expected to be served from the same origin. Production routing, reverse proxy, and deployment details are intentionally deferred.
- Do not bake absolute API origins into browser-facing application code unless a future deployment design explicitly requires it.

## Testing
- Use `Vitest` for unit and component tests.
- Use `React Testing Library` for React component behavior tests.
- Use `MSW` for network-level API mocking in unit/component/integration tests.
- Use `Playwright` for browser-level integration tests.

## GraphQL Code Generation
- Use GraphQL Code Generator for operation result types, operation variable types, and typed document nodes.
- Avoid generated React hooks and fragment masking unless the project explicitly adopts those patterns later.

## CI and Releases
- GitHub Actions runs CI on pushes to `main`, `feature/**`, and `bugfix/**` branches.
- GitHub Actions also runs CI on pull requests targeting `main`.
- CI runs linting, unit/component tests, production build, and Playwright browser integration tests.
- Release Please runs on pushes to `main`.
- Release Please manages version bumps, changelog updates, GitHub releases, and npm package publication to GitHub Packages.
- The npm package is published to GitHub Packages under the `@pmeyer` scope.
- Configure a `RELEASE_PLEASE_TOKEN` repository secret if Release Please-created pull requests should trigger downstream workflows. Without it, the workflow falls back to `GITHUB_TOKEN`, which can create releases but will not trigger additional workflows from its own PRs or tags.
