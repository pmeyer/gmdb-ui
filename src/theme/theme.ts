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
  typography: {
    button: {
      textTransform: 'none'
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiInputLabel: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiSelect: {
      defaultProps: {
        size: 'small'
      }
    },
    MuiOutlinedInput: {
      defaultProps: {
        size:  'small'
      }
    },
    MuiFilledInput: {
      defaultProps: {
        size: 'small'
      }
    },
  },
});

export default theme;
