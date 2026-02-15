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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MonetizationOn as RevenueIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

const Analytics = () => {
  const { api } = useApi();
  const { subscribe, unsubscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Real analytics state
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [crossChainMetrics, setCrossChainMetrics] = useState(null);
  const [crossChainTrends, setCrossChainTrends] = useState(null);
  const [userSegmentation, setUserSegmentation] = useState(null);
  const [maintenanceRecommendations, setMaintenanceRecommendations] = useState([]);

  // Device data for pie chart (from real metrics if available)
  const deviceData = realtimeMetrics?.data?.users?.geographicDistribution
    ? Object.entries(realtimeMetrics.data.users.geographicDistribution).map(([name, value], i) => ({
        name,
        value: Math.round(value),
        color: ['#00eaff', '#4ecdc4', '#ffd93d', '#ff6b6b'][i % 4]
      }))
    : [
        { name: 'Desktop', value: 45, color: '#00eaff' },
        { name: 'Mobile', value: 35, color: '#4ecdc4' },
        { name: 'Tablet', value: 20, color: '#ffd93d' }
      ];

  // Top pages (placeholder, could be replaced with real user analytics)
  const topPages = [];


  // Fetch all analytics data from backend
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/api/analytics/realtime/metrics'),
      api.get('/api/analytics/realtime/alerts'),
      api.get('/api/analytics/crosschain/metrics'),
      api.get('/api/analytics/crosschain/analytics?timeframe=24'),
      api.get('/api/analytics/user/segmentation'),
      api.get('/api/analytics/maintenance/recommendations')
    ])
      .then(([
        realtimeMetricsRes,
        realtimeAlertsRes,
        crossChainMetricsRes,
        crossChainTrendsRes,
        userSegmentationRes,
        maintenanceRecommendationsRes
      ]) => {
        setRealtimeMetrics(realtimeMetricsRes.data);
        setRealtimeAlerts(realtimeAlertsRes.data);
        setCrossChainMetrics(crossChainMetricsRes.data);
        setCrossChainTrends(crossChainTrendsRes.data);
        setUserSegmentation(userSegmentationRes.data);
        setMaintenanceRecommendations(maintenanceRecommendationsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load analytics data');
        setLoading(false);
        console.error('Analytics data error:', err);
      });
  }, [timeRange]);

  const handleRefresh = () => {
    // Re-run the effect by updating timeRange (or use a forceRefresh state)
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/api/analytics/realtime/metrics'),
      api.get('/api/analytics/realtime/alerts'),
      api.get('/api/analytics/crosschain/metrics'),
      api.get('/api/analytics/crosschain/analytics?timeframe=24'),
      api.get('/api/analytics/user/segmentation'),
      api.get('/api/analytics/maintenance/recommendations')
    ])
      .then(([
        realtimeMetricsRes,
        realtimeAlertsRes,
        crossChainMetricsRes,
        crossChainTrendsRes,
        userSegmentationRes,
        maintenanceRecommendationsRes
      ]) => {
        setRealtimeMetrics(realtimeMetricsRes.data);
        setRealtimeAlerts(realtimeAlertsRes.data);
        setCrossChainMetrics(crossChainMetricsRes.data);
        setCrossChainTrends(crossChainTrendsRes.data);
        setUserSegmentation(userSegmentationRes.data);
        setMaintenanceRecommendations(maintenanceRecommendationsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to refresh analytics data');
        setLoading(false);
        console.error('Analytics data error:', err);
      });
  };

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting analytics data...');
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const StatCard = ({ title, value, change, icon: Icon, color = '#00eaff' }) => (
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
        {change && (
          <Box display="flex" alignItems="center">
            {change > 0 ? (
              <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
            ) : (
              <TrendingUpIcon
                sx={{ color: '#f44336', fontSize: 16, mr: 0.5, transform: 'rotate(180deg)' }}
              />
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
        <Typography>Loading analytics...</Typography>
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
          Analytics Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: '#b2ebf2' }}>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
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
                }
              }}
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
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
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{
              backgroundColor: '#00eaff',
              '&:hover': {
                backgroundColor: '#00d4ff'
              }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>


      {/* Analytics Stats (from real-time and cross-chain metrics) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={formatNumber(realtimeMetrics?.data?.users?.activeUsers || 0)}
            change={12.5}
            icon={PeopleIcon}
            color="#00eaff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={formatNumber(realtimeMetrics?.data?.users?.newUsers || 0)}
            change={8.2}
            icon={AnalyticsIcon}
            color="#4ecdc4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="TVL (DeFi)"
            value={`$${formatNumber(realtimeMetrics?.data?.defi?.totalValueLocked || 0)}`}
            change={15.3}
            icon={RevenueIcon}
            color="#ffd93d"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={realtimeMetrics?.data?.system?.cpuUsage ? `${realtimeMetrics.data.system.cpuUsage.toFixed(1)}% CPU` : 'N/A'}
            change={-2.1}
            icon={TrendingUpIcon}
            color="#ff6b6b"
          />
        </Grid>
      </Grid>


      {/* Charts (replace with real data as available) */}
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
                Cross-Chain TVL (last 24h)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={crossChainMetrics?.chains ? Object.entries(crossChainMetrics.chains).map(([name, d]) => ({ name, tvl: d.tvl })) : []}>
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
                  <Area
                    type="monotone"
                    dataKey="tvl"
                    stroke="#00eaff"
                    fill="#00eaff"
                    fillOpacity={0.6}
                  />
                </AreaChart>
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
                Device Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
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
                {deviceData.map((item) => (
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

      {/* Detailed Analytics Tabs */}
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
          <Tab label="Revenue Analytics" />
          <Tab label="User Behavior" />
          <Tab label="Performance" />
        </Tabs>

        {/* Revenue Analytics Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
              Revenue Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueDataMock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                <XAxis dataKey="name" stroke="#b2ebf2" />
                <YAxis yAxisId="left" stroke="#b2ebf2" />
                <YAxis yAxisId="right" orientation="right" stroke="#4ecdc4" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2d3a',
                    borderRadius: 8
                  }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#00eaff" />
                <Bar yAxisId="right" dataKey="transactions" fill="#4ecdc4" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* User Behavior Tab */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Page</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Page Views</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Unique Visitors</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Bounce Rate</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Avg. Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPages.map((page, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                      {page.page}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{page.views.toLocaleString()}</TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>
                      {Math.floor(page.views * 0.7).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${page.bounce}%`}
                        size="small"
                        sx={{
                          backgroundColor:
                            page.bounce < 30 ? '#4caf50' : page.bounce < 40 ? '#ff9800' : '#f44336',
                          color: '#ffffff'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {Math.floor(Math.random() * 300) + 60}s
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Performance Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                  System Performance
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      API Response Time
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4ecdc4' }}>
                      245ms
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={85} sx={{ mb: 2 }} />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      Database Query Time
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4ecdc4' }}>
                      89ms
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={95} sx={{ mb: 2 }} />
                </Box>

                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      WebSocket Latency
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4ecdc4' }}>
                      12ms
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={98} />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                  Error Rates
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      API Errors (24h)
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      0.02%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={2} sx={{ mb: 2 }} />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      Failed Transactions
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      0.01%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={1} sx={{ mb: 2 }} />
                </Box>

                <Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: '#b2ebf2' }}>
                      Connection Drops
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4caf50' }}>
                      0.05%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={5} />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Analytics;
