import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import { ThemeProvider } from "@mui/material/styles";

import App from "./App";
import { gmdbClient } from "./graphql/GmdbClient";
import "./styles/global.css";
import theme from "./theme/theme";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <ApolloProvider client={gmdbClient}>
        <App />
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>,
);
