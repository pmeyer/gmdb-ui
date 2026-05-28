import { amber, red } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

// A custom theme for this app
const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    warning: {
      main: amber[900],
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
