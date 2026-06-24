import type { ReactElement, ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { ThemeProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
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
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ApolloProvider client={client}>{children}</ApolloProvider>
        </LocalizationProvider>
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
