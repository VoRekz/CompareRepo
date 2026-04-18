import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { AuthProvider } from './context/AuthContext.tsx';

const theme = createTheme({
  palette: {
    background: {
      default: '#ffffff', // Ensures the whole page background is white
    },
    primary: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#757575',
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
