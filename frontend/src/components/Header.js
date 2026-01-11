import React from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography, IconButton, Box, Chip, useTheme } from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const theme = useTheme();
  const { connected, messages } = useWebSocket();

  const unreadNotifications = messages.filter(
    (msg) => msg.type === 'systemAlert' || msg.type === 'error'
  ).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(90deg, #0f2027 0%, #2c5364 100%)',
        boxShadow: '0 2px 8px rgba(0, 234, 255, 0.1)',
        borderBottom: '1px solid #2a2d3a'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontFamily: '\'Orbitron\', sans-serif',
            fontWeight: 700,
            letterSpacing: '1px',
            background: 'linear-gradient(45deg, #00eaff, #4ecdc4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          ÆTHERON
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Connection Status */}
          <Chip
            icon={connected ? <WifiIcon /> : <WifiOffIcon />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            size="small"
            sx={{
              backgroundColor: connected ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 71, 87, 0.1)',
              color: connected ? '#00d4aa' : '#ff4757',
              border: `1px solid ${connected ? '#00d4aa' : '#ff4757'}`
            }}
          />

          {/* Notifications */}
          <IconButton color="inherit" sx={{ position: 'relative' }}>
            <NotificationsIcon />
            {unreadNotifications > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#ff4757',
                  color: 'white',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Box>
            )}
          </IconButton>

          {/* User Account */}
          <IconButton color="inherit">
            <AccountIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired
};

export default Header;
