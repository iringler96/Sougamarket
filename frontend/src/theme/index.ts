import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#7b1fa2'
    },
    secondary: {
      main: '#ff9800'
    },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff'
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: `'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: { fontSize: '2.6rem', fontWeight: 800 },
    h2: { fontSize: '2rem', fontWeight: 800 },
    h3: { fontSize: '1.4rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 18px 45px rgba(35, 39, 47, 0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16
        }
      }
    }
  }
});
