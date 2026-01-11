import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  SwapHoriz as SwapIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for charts
  const transactionData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 }
  ];

  const assetDistribution = [
    { name: 'ETH', value: 35, color: '#627eea' },
    { name: 'BTC', value: 25, color: '#f7931a' },
    { name: 'USDC', value: 20, color: '#2775ca' },
    { name: 'Others', value: 20, color: '#6c757d' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Mock data instead of API calls
      const mockStats = {
        totalUsers: 12543,
        totalTransactions: 45678,
        totalVolume: 2345678,
        activeWallets: 8921,
        tvl: 12345678,
        gasUsed: 456789
      };
      const mockActivity = [
        {
          id: 1,
          type: 'transaction',
          title: 'Large ETH Transfer',
          description: '2.5 ETH sent',
          timestamp: '2 min ago',
          status: 'success'
        },
        {
          id: 2,
          type: 'swap',
          title: 'Token Swap',
          description: 'ETH → USDC',
          timestamp: '5 min ago',
          status: 'success'
        },
        {
          id: 3,
          type: 'user',
          title: 'New User Registration',
          description: 'User 0x123...abc joined',
          timestamp: '8 min ago',
          status: 'success'
        },
        {
          id: 4,
          type: 'security',
          title: 'Security Alert',
          description: 'Unusual activity detected',
          timestamp: '12 min ago',
          status: 'warning'
        },
        {
          id: 5,
          type: 'notification',
          title: 'System Update',
          description: 'Version 2.1.0 deployed',
          timestamp: '15 min ago',
          status: 'info'
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = '#00eaff' }) => (
    <Card
      sx={{
        background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
        border: '1px solid #2a2d3a',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 0 20px ${color}20`
        }
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
        {change && (
          <Box display="flex" alignItems="center">
            {change > 0 ? (
              <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
            ) : (
              <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16, mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: change > 0 ? '#4caf50' : '#f44336',
                fontWeight: 500
              }}
            >
              {Math.abs(change)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    change: PropTypes.number,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading dashboard...</Typography>
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
      <Typography variant="h4" sx={{ mb: 3, color: '#ffffff', fontWeight: 600 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value Locked"
            value={stats?.tvl ? `$${(stats.tvl / 1000000).toFixed(1)}M` : '$12.3M'}
            change={12.5}
            icon={WalletIcon}
            color="#00eaff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats?.totalUsers?.toLocaleString() || '12,543'}
            change={8.2}
            icon={PeopleIcon}
            color="#4ecdc4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="24h Volume"
            value={stats?.totalVolume ? `$${(stats.totalVolume / 1000000).toFixed(1)}M` : '$2.3M'}
            change={-3.7}
            icon={MonetizationIcon}
            color="#ff6b6b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Security Score"
            value="98%"
            change={2.1}
            icon={SecurityIcon}
            color="#ffd93d"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
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
                Transaction Volume (6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={transactionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="name" stroke="#b2ebf2" />
                  <YAxis stroke="#b2ebf2" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2d3a',
                      borderRadius: 8
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00eaff"
                    strokeWidth={3}
                    dot={{ fill: '#00eaff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
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
                Asset Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2d3a',
                      borderRadius: 8
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {assetDistribution.map((item) => (
                  <Box key={item.name} display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color,
                        borderRadius: '50%',
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#b2ebf2', flex: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and System Status */}
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
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#00eaff' }}>
                          {activity.type === 'transaction' && <SwapIcon />}
                          {activity.type === 'user' && <PeopleIcon />}
                          {activity.type === 'security' && <SecurityIcon />}
                          {activity.type === 'notification' && <NotificationsIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: '#ffffff' }}>
                            {activity.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#8892a0' }}>
                            {activity.description} • {activity.timestamp}
                          </Typography>
                        }
                      />
                      <Chip
                        label={activity.status}
                        size="small"
                        sx={{
                          backgroundColor:
                            activity.status === 'success'
                              ? '#4caf50'
                              : activity.status === 'warning'
                                ? '#ff9800'
                                : '#2196f3',
                          color: '#ffffff'
                        }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && (
                      <Divider sx={{ borderColor: '#2a2d3a' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
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
                System Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    Blockchain Sync
                  </Typography>
                  <Chip
                    label="Synced"
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
                    API Health
                  </Typography>
                  <Chip
                    label="Healthy"
                    size="small"
                    sx={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                  />
                </Box>
                <LinearProgress variant="determinate" value={98} sx={{ mb: 2 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                    Database
                  </Typography>
                  <Chip
                    label="Connected"
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
                    WebSocket
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
      </Grid>

      {/* Admin Controls Section */}
      <Typography variant="h4" sx={{ mb: 3, color: '#ffffff', fontWeight: 600, mt: 4 }}>
        Admin Controls
      </Typography>

      <Grid container spacing={3}>
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
              <Typography variant="h6" sx={{ mb: 2, color: '#00eaff' }}>
                User Management
              </Typography>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#b2ebf2', mb: 1 }}>
                    Search User
                  </Typography>
                  <input
                    type="text"
                    placeholder="Enter user address or ID"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      background: '#181c2a',
                      color: '#e0e0e0',
                      fontFamily: 'Share Tech Mono, monospace'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#00eaff',
                      color: '#181c2a',
                      cursor: 'pointer',
                      fontFamily: 'Orbitron, sans-serif',
                      fontWeight: 'bold'
                    }}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#ff6b6b',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontFamily: 'Orbitron, sans-serif',
                      fontWeight: 'bold'
                    }}
                  >
                    Ban User
                  </button>
                </Box>
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
              <Typography variant="h6" sx={{ mb: 2, color: '#00eaff' }}>
                System Configuration
              </Typography>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#b2ebf2', mb: 1 }}>
                    Gas Price (Gwei)
                  </Typography>
                  <input
                    type="number"
                    defaultValue="20"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      background: '#181c2a',
                      color: '#e0e0e0',
                      fontFamily: 'Share Tech Mono, monospace'
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#b2ebf2', mb: 1 }}>
                    Max Transaction Size
                  </Typography>
                  <input
                    type="number"
                    defaultValue="1000000"
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #333',
                      background: '#181c2a',
                      color: '#e0e0e0',
                      fontFamily: 'Share Tech Mono, monospace'
                    }}
                  />
                </Box>
                <button
                  type="button"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#00eaff',
                    color: '#181c2a',
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 'bold'
                  }}
                >
                  Update Settings
                </button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              background:
                'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
              border: '1px solid #2a2d3a',
              borderRadius: 2
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#00eaff' }}>
                Export Data
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <select
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #333',
                    background: '#181c2a',
                    color: '#e0e0e0',
                    fontFamily: 'Share Tech Mono, monospace'
                  }}
                >
                  <option value="users">User Data</option>
                  <option value="transactions">Transaction History</option>
                  <option value="analytics">Analytics Report</option>
                  <option value="logs">System Logs</option>
                </select>
                <button
                  type="button"
                  id="export-data"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#00eaff',
                    color: '#181c2a',
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                    fontWeight: 'bold'
                  }}
                >
                  Export
                </button>
              </Box>
              <Box sx={{ mt: 2, p: 2, background: '#1a2636', borderRadius: '4px' }}>
                <Typography variant="body2" sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                  Export results will appear here...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
