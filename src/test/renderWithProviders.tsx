import type { ReactElement, ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";

import { createGmdbClient } from "../graphql/GmdbClient";
import theme from "../theme/theme";

interface TestProvidersProps {
  children: ReactNode;
}

function createTestProviders() {
  const client = createGmdbClient("http://localhost/graphql");

  function TestProviders({ children }: TestProvidersProps) {
    return (
      <ThemeProvider theme={theme}>
        <ApolloProvider client={client}>{children}</ApolloProvider>
      </ThemeProvider>
    );
  }

  return TestProviders;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: createTestProviders(),
    ...options,
  });
}
