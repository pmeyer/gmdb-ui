# Repository Guidelines

## Commit & Pull Request Guidelines
- Use [convention commits](https://www.conventionalcommits.org/en/v1.0.0/#:~:text=The%20Conventional%20Commits%20specification%20is,automated%20tools%20on%20top%20of). 
- Group related edits together instead of squashing unrelated fixes.
- PRs should describe context, list notable changes, and call out schema updates or required migrations. Link Jira/GitHub issues when available.
- Always create a new branch for deliverable piece of work.

## Coding Guidelines
- TypeScript to be used
- Use strict mode
- Avoid `any`: Treat `any` as a failure; use specific types or generics to maintain type safety across components and hooks.
- Explicit Prop Typing: Define an `interface` or `type` for every component's props.
  - Interfaces over Types: Use interfaces for props to allow for future extension and better error messages.
  - Discriminated Unions: Use unions for components with mutually exclusive prop sets (e.g., a button that is either a "link" or an "action").
- Typed `useState` or `useMemo`: Let TypeScript infer simple types, but use generics (e.g., `useState<User | null>(null)`) for complex objects or union types.
- Event Handling: Explicitly type event handlers using built-in React types like `React.ChangeEvent<HTMLInputElement>` or `React.FormEvent` to access specific properties. For components that may emit custom events, explicitly type their handlers as appropriate.
- Prefer chained functional style programming where searches, filters, maps, transformations or other operations over collections or objects are performed.
- Functional Components: Favor function declarations over arrow functions for better hoisting and stack tracing.
- Avoid "bare" arrow functions in React component render functions or hook bodies. Use React constructs (e.g. use `useCallback`) except for the absolute simplest/trivial event handlers.
- Breakout business logic from components that render React JSX when they exceed complexity of basic operations, or the aggregate of business logic in the component begins to add a high degree of cyclomatic or cognitive complexity. Logic should be moved into an custom hook component that encapsulates the behavior and exposes required data, functions, etc. through its return statement (i.e. acts like a "component" controller). This separates component logic/behavior from the rendering of the component making both more testable by allowing mocking of the custom hook for testing the UI and direct unit testing of the custom hook logic.