import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';

const Settings = () => {
  const { api } = useApi();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    profile: {
      name: '',
      email: '',
      avatar: ''
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      securityAlerts: true,
      transactionAlerts: true,
      marketingEmails: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotifications: true
    },
    appearance: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    }
  });
  const [loading, setLoading] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/api/settings', settings);
      setHasChanges(false);
      setSaveDialog(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveClick = () => {
    if (hasChanges) {
      setSaveDialog(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
          Settings
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSettings}
            sx={{
              borderColor: '#00eaff',
              color: '#00eaff',
              '&:hover': {
                borderColor: '#00eaff',
                backgroundColor: 'rgba(0, 234, 255, 0.1)'
              }
            }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveClick}
            disabled={!hasChanges || loading}
            sx={{
              backgroundColor: '#00eaff',
              '&:hover': {
                backgroundColor: '#00d4ff'
              },
              '&:disabled': {
                backgroundColor: '#666'
              }
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
        </Alert>
      )}

      <Card sx={{
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
        border: '1px solid #2a2d3a',
        borderRadius: 2
      }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: '1px solid #2a2d3a',
            '& .MuiTab-root': {
              color: '#8892a0',
              '&.Mui-selected': {
                color: '#00eaff'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00eaff'
            }
          }}
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<PaletteIcon />} label="Appearance" />
        </Tabs>

        {/* Profile Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
              Profile Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      bgcolor: '#00eaff',
                      mb: 2,
                      fontSize: '2rem'
                    }}
                  >
                    {settings.profile.name ? settings.profile.name[0].toUpperCase() : 'U'}
                  </Avatar>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#00eaff',
                      color: '#00eaff',
                      '&:hover': {
                        borderColor: '#00eaff',
                        backgroundColor: 'rgba(0, 234, 255, 0.1)'
                      }
                    }}
                  >
                    Change Avatar
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={settings.profile.name}
                  onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(26, 26, 46, 0.8)',
                      border: '1px solid #2a2d3a',
                      '& fieldset': {
                        border: 'none'
                      },
                      '&:hover fieldset': {
                        border: 'none'
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#ffffff'
                    },
                    '& .MuiInputLabel-root': {
                      color: '#b2ebf2'
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(26, 26, 46, 0.8)',
                      border: '1px solid #2a2d3a',
                      '& fieldset': {
                        border: 'none'
                      },
                      '&:hover fieldset': {
                        border: 'none'
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none'
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      color: '#ffffff'
                    },
                    '& .MuiInputLabel-root': {
                      color: '#b2ebf2'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Notifications Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
              Notification Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary={<Typography sx={{ color: '#ffffff' }}>Email Alerts</Typography>}
                  secondary={<Typography sx={{ color: '#8892a0' }}>Receive important alerts via email</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00eaff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 234, 255, 0.1)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00eaff'
                      }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider sx={{ borderColor: '#2a2d3a' }} />

              <ListItem>
                <ListItemText
                  primary={<Typography sx={{ color: '#ffffff' }}>Push Notifications</Typography>}
                  secondary={<Typography sx={{ color: '#8892a0' }}>Browser push notifications for real-time updates</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00eaff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 234, 255, 0.1)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00eaff'
                      }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider sx={{ borderColor: '#2a2d3a' }} />

              <ListItem>
                <ListItemText
                  primary={<Typography sx={{ color: '#ffffff' }}>Security Alerts</Typography>}
                  secondary={<Typography sx={{ color: '#8892a0' }}>Alerts for security-related events</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00eaff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 234, 255, 0.1)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00eaff'
                      }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider sx={{ borderColor: '#2a2d3a' }} />

              <ListItem>
                <ListItemText
                  primary={<Typography sx={{ color: '#ffffff' }}>Transaction Alerts</Typography>}
                  secondary={<Typography sx={{ color: '#8892a0' }}>Notifications for transaction activities</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.transactionAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'transactionAlerts', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00eaff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 234, 255, 0.1)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00eaff'
                      }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider sx={{ borderColor: '#2a2d3a' }} />

              <ListItem>
                <ListItemText
                  primary={<Typography sx={{ color: '#ffffff' }}>Marketing Emails</Typography>}
                  secondary={<Typography sx={{ color: '#8892a0' }}>Receive updates about new features and promotions</Typography>}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onChange={(e) => handleSettingChange('notifications', 'marketingEmails', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#00eaff',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 234, 255, 0.1)'
                        }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#00eaff'
                      }
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        )}

        {/* Security Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
              Security Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00eaff',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 234, 255, 0.1)'
                          }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00eaff'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#ffffff' }}>Two-Factor Authentication</Typography>}
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.loginNotifications}
                      onChange={(e) => handleSettingChange('security', 'loginNotifications', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00eaff',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 234, 255, 0.1)'
                          }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00eaff'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#ffffff' }}>Login Notifications</Typography>}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Session Timeout (minutes)</InputLabel>
                  <Select
                    value={settings.security.sessionTimeout}
                    label="Session Timeout (minutes)"
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Password Expiry (days)</InputLabel>
                  <Select
                    value={settings.security.passwordExpiry}
                    label="Password Expiry (days)"
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value={30}>30 days</MenuItem>
                    <MenuItem value={60}>60 days</MenuItem>
                    <MenuItem value={90}>90 days</MenuItem>
                    <MenuItem value={0}>Never</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<KeyIcon />}
                  sx={{
                    borderColor: '#ff6b6b',
                    color: '#ff6b6b',
                    '&:hover': {
                      borderColor: '#ff6b6b',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)'
                    }
                  }}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Appearance Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, color: '#ffffff' }}>
              Appearance Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Theme</InputLabel>
                  <Select
                    value={settings.appearance.theme}
                    label="Theme"
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Language</InputLabel>
                  <Select
                    value={settings.appearance.language}
                    label="Language"
                    onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="zh">中文</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Timezone</InputLabel>
                  <Select
                    value={settings.appearance.timezone}
                    label="Timezone"
                    onChange={(e) => handleSettingChange('appearance', 'timezone', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                    <MenuItem value="GMT">GMT</MenuItem>
                    <MenuItem value="CET">Central European Time</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#b2ebf2' }}>Date Format</InputLabel>
                  <Select
                    value={settings.appearance.dateFormat}
                    label="Date Format"
                    onChange={(e) => handleSettingChange('appearance', 'dateFormat', e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2a2d3a'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00eaff'
                      },
                      '& .MuiSelect-icon': {
                        color: '#b2ebf2'
                      }
                    }}
                  >
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>

      {/* Save Confirmation Dialog */}
      <Dialog
        open={saveDialog}
        onClose={() => setSaveDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            border: '1px solid #2a2d3a'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Confirm Save
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#b2ebf2' }}>
            Are you sure you want to save these changes? Some settings may require you to refresh the page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSaveDialog(false)}
            sx={{ color: '#8892a0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#00eaff',
              '&:hover': {
                backgroundColor: '#00d4ff'
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;