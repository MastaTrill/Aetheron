import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  BugReport as BugIcon,
  Gavel as AuditIcon
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

const Security = () => {
  const { api } = useApi();
  const { subscribe, unsubscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [securityStats, setSecurityStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [audits, setAudits] = useState([]);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSecurityData();

    // Subscribe to real-time security updates
    const handleAlertUpdate = (data) => {
      setAlerts((prev) => [data, ...prev.slice(0, 19)]);
    };

    const handleThreatUpdate = (data) => {
      setThreats((prev) => [data, ...prev.slice(0, 19)]);
    };

    subscribe('security-alert', handleAlertUpdate);
    subscribe('threat-detected', handleThreatUpdate);

    return () => {
      unsubscribe('security-alert', handleAlertUpdate);
      unsubscribe('threat-detected', handleThreatUpdate);
    };
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [statsResponse, alertsResponse, auditsResponse, threatsResponse] = await Promise.all([
        api.get('/api/security/stats'),
        api.get('/api/security/alerts'),
        api.get('/api/security/audits'),
        api.get('/api/security/threats')
      ]);

      setSecurityStats(statsResponse.data);
      setAlerts(alertsResponse.data);
      setAudits(auditsResponse.data);
      setThreats(threatsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load security data');
      console.error('Security data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadSecurityData();
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
    case 'critical':
      return '#f44336';
    case 'high':
      return '#ff9800';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
    default:
      return '#9e9e9e';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
    case 'active':
      return '#f44336';
    case 'resolved':
      return '#4caf50';
    case 'investigating':
      return '#ff9800';
    case 'passed':
      return '#4caf50';
    case 'failed':
      return '#f44336';
    default:
      return '#9e9e9e';
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = '#00eaff' }) => (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
        border: '1px solid #2a2d3a',
        borderRadius: 2,
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 20px ${color}20`
        },
        transition: 'all 0.3s ease'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" sx={{ color: '#b2ebf2', fontSize: '0.9rem' }}>
            {title}
          </Typography>
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#8892a0' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading security data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600 }}>
          Security Center
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{
            borderColor: '#00eaff',
            color: '#00eaff',
            '&:hover': {
              borderColor: '#00eaff',
              backgroundColor: 'rgba(0, 234, 255, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Security Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Security Score"
            value={securityStats?.securityScore || '98%'}
            subtitle="Excellent"
            icon={ShieldIcon}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Threats"
            value={securityStats?.activeThreats || '3'}
            subtitle="Under monitoring"
            icon={WarningIcon}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Blocked Attacks"
            value={securityStats?.blockedAttacks || '1,247'}
            subtitle="Last 24h"
            icon={LockIcon}
            color="#00eaff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Audit Status"
            value={securityStats?.auditStatus || 'Passed'}
            subtitle="Last audit: 2 days ago"
            icon={AuditIcon}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Security Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
              border: '1px solid #2a2d3a',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                System Health
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    Firewall Status
                  </Typography>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                  />
                </Box>
                <LinearProgress variant="determinate" value={100} sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    Encryption
                  </Typography>
                  <Chip
                    label="AES-256"
                    size="small"
                    sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                  />
                </Box>
                <LinearProgress variant="determinate" value={100} sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    Multi-Sig Wallets
                  </Typography>
                  <Chip
                    label="Enabled"
                    size="small"
                    sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                  />
                </Box>
                <LinearProgress variant="determinate" value={100} sx={{ mb: 2 }} />
              </Box>

              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    DDoS Protection
                  </Typography>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                  />
                </Box>
                <LinearProgress variant="determinate" value={95} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
              border: '1px solid #2a2d3a',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                Recent Security Events
              </Typography>
              <List>
                {alerts.slice(0, 5).map((alert, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getSeverityColor(alert.severity),
                            width: 32,
                            height: 32
                          }}
                        >
                          {alert.type === 'intrusion' && <WarningIcon sx={{ fontSize: 16 }} />}
                          {alert.type === 'suspicious' && <BugIcon sx={{ fontSize: 16 }} />}
                          {alert.type === 'audit' && <AuditIcon sx={{ fontSize: 16 }} />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            {alert.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#8892a0' }}>
                            {alert.description} • {alert.timestamp}
                          </Typography>
                        }
                      />
                      <Chip
                        label={alert.severity}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(alert.severity),
                          color: '#ffffff'
                        }}
                      />
                    </ListItem>
                    {index < alerts.slice(0, 5).length - 1 && (
                      <Divider sx={{ borderColor: '#2a2d3a' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Security Tabs */}
      <Card
        sx={{
          background:
            'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
          border: '1px solid #2a2d3a',
          borderRadius: 2
        }}
      >
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
          <Tab label="Security Alerts" />
          <Tab label="Threat Intelligence" />
          <Tab label="Audit Logs" />
        </Tabs>

        {/* Security Alerts Tab */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Source IP</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>
                      <Box display="flex" alignItems="center">
                        {alert.type === 'intrusion' && (
                          <WarningIcon sx={{ color: '#f44336', mr: 1, fontSize: 18 }} />
                        )}
                        {alert.type === 'suspicious' && (
                          <BugIcon sx={{ color: '#ff9800', mr: 1, fontSize: 18 }} />
                        )}
                        {alert.type === 'audit' && (
                          <AuditIcon sx={{ color: '#4caf50', mr: 1, fontSize: 18 }} />
                        )}
                        {alert.type}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{alert.description}</TableCell>
                    <TableCell sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                      {alert.sourceIP || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.severity}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(alert.severity),
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(alert.status),
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Threat Intelligence Tab */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Threat ID</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Risk Level</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Detected</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {threats.map((threat) => (
                  <TableRow
                    key={threat.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                      {threat.id}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{threat.type}</TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{threat.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={threat.riskLevel}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(threat.riskLevel),
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#8892a0' }}>
                      {new Date(threat.detectedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
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
                        Investigate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Resource</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Result</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow
                    key={audit.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      {new Date(audit.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>{audit.user}</TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{audit.action}</TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{audit.resource}</TableCell>
                    <TableCell>
                      <Chip
                        label={audit.result}
                        size="small"
                        sx={{
                          backgroundColor: audit.result === 'success' ? '#4caf50' : '#f44336',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                      {audit.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
};

export default Security;
