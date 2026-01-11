import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Blockchain from './pages/Blockchain';
import DeFi from './pages/DeFi';
import Analytics from './pages/Analytics';
import Security from './pages/Security';
import Settings from './pages/Settings';
import { WebSocketProvider } from './hooks/useWebSocket';
import { ApiProvider } from './hooks/useApi';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00eaff'
    },
    secondary: {
      main: '#ff6b6b'
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b2ebf2'
    }
  },
  typography: {
    fontFamily: '\'Share Tech Mono\', monospace',
    h1: {
      fontFamily: '\'Orbitron\', sans-serif',
      fontWeight: 700
    },
    h2: {
      fontFamily: '\'Orbitron\', sans-serif',
      fontWeight: 600
    },
    h3: {
      fontFamily: '\'Orbitron\', sans-serif',
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontFamily: '\'Orbitron\', sans-serif',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 234, 255, 0.1)',
          border: '1px solid #2a2d3a'
        }
      }
    }
  }
});

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'blockchain':
      return <Blockchain />;
    case 'defi':
      return <DeFi />;
    case 'analytics':
      return <Analytics />;
    case 'security':
      return <Security />;
    case 'settings':
      return <Settings />;
    default:
      return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ApiProvider>
        <WebSocketProvider>
          <Box className="app">
            <Header
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
              <Sidebar
                open={sidebarOpen}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  p: 3,
                  transition: 'margin-left 0.3s ease',
                  marginLeft: sidebarOpen ? '280px' : '80px',
                  minHeight: 'calc(100vh - 64px)'
                }}
              >
                {renderPage()}
              </Box>
            </Box>
          </Box>
        </WebSocketProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}

export default App;

/* eslint-env browser, es2021 */
/* eslint-plugin-react */
/* eslint-config-eslint:recommended */
/* eslint-config-plugin:react/recommended */