import React from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as BlockchainIcon,
  MonetizationOn as DefiIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const drawerWidth = 280;
const collapsedWidth = 80;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? drawerWidth : collapsedWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : collapsedWidth,
    boxSizing: 'border-box',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
    borderRight: '1px solid #2a2d3a',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden'
  }
}));

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'blockchain', label: 'Blockchain', icon: BlockchainIcon },
  { id: 'defi', label: 'DeFi', icon: DefiIcon },
  { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
  { id: 'security', label: 'Security', icon: SecurityIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
];

const Sidebar = ({ open, currentPage, setCurrentPage }) => {
  return (
    <StyledDrawer variant="permanent" open={open}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          borderBottom: '1px solid #2a2d3a'
        }}
      >
        {open && (
          <Typography
            variant="h6"
            sx={{
              fontFamily: '\'Orbitron\', sans-serif',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #00eaff, #4ecdc4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            ADMIN
          </Typography>
        )}
      </Box>

      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => setCurrentPage(item.id)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  backgroundColor: isActive ? 'rgba(0, 234, 255, 0.1)' : 'transparent',
                  border: isActive ? '1px solid #00eaff' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 234, 255, 0.05)',
                    borderColor: 'rgba(0, 234, 255, 0.3)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: open ? 40 : 'auto',
                    color: isActive ? '#00eaff' : '#b2ebf2',
                    justifyContent: open ? 'flex-start' : 'center'
                  }}
                >
                  <Icon />
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: isActive ? '#00eaff' : '#b2ebf2',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.95rem'
                      }
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ borderColor: '#2a2d3a' }} />

      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: '#8892a0',
            fontSize: '0.75rem',
            textAlign: open ? 'left' : 'center',
            display: 'block'
          }}
        >
          {open ? 'Aetheron v1.0.0' : 'v1.0'}
        </Typography>
      </Box>
    </StyledDrawer>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  currentPage: PropTypes.string.isRequired,
  setCurrentPage: PropTypes.func.isRequired
};

export default Sidebar;
