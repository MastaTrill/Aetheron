import React, { useState, useEffect } from 'react';
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
  Paper,
  Chip,
  Avatar,
  Button,
  LinearProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as SwapIcon,
  MonetizationOn as YieldIcon,
  Pool as PoolIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

const Defi = () => {
  const { api } = useApi();
  const { subscribe, unsubscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [defiStats, setDefiStats] = useState(null);
  const [pools, setPools] = useState([]);
  const [yields, setYields] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for charts
  const tvlData = [
    { name: 'Jan', value: 1200000 },
    { name: 'Feb', value: 1350000 },
    { name: 'Mar', value: 1180000 },
    { name: 'Apr', value: 1420000 },
    { name: 'May', value: 1680000 },
    { name: 'Jun', value: 1950000 }
  ];

  const yieldData = [
    { name: 'AAVE', apy: 4.2, tvl: 1200000 },
    { name: 'Compound', apy: 3.8, tvl: 950000 },
    { name: 'Uniswap', apy: 12.5, tvl: 1800000 },
    { name: 'Curve', apy: 8.1, tvl: 750000 },
    { name: 'Yearn', apy: 15.2, tvl: 650000 }
  ];

  useEffect(() => {
    loadDefiData();

    // Subscribe to real-time DeFi updates
    const handlePoolUpdate = (data) => {
      setPools(prev => prev.map(pool =>
        pool.id === data.id ? { ...pool, ...data } : pool
      ));
    };

    const handleYieldUpdate = (data) => {
      setYields(prev => prev.map(yield_ =>
        yield_.protocol === data.protocol ? { ...yield_, ...data } : yield_
      ));
    };

    subscribe('poolUpdate', handlePoolUpdate);
    subscribe('yieldUpdate', handleYieldUpdate);

    return () => {
      unsubscribe('poolUpdate', handlePoolUpdate);
      unsubscribe('yieldUpdate', handleYieldUpdate);
    };
  }, []);

  const loadDefiData = async () => {
    try {
      setLoading(true);
      const [statsResponse, poolsResponse, yieldsResponse, protocolsResponse] = await Promise.all([
        api.get('/api/defi/stats'),
        api.get('/api/defi/pools'),
        api.get('/api/defi/yields'),
        api.get('/api/defi/protocols')
      ]);

      setDefiStats(statsResponse.data);
      setPools(poolsResponse.data);
      setYields(yieldsResponse.data);
      setProtocols(protocolsResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load DeFi data');
      console.error('DeFi data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDefiData();
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const StatCard = ({ title, value, change, icon: Icon, color = '#00eaff' }) => (
    <Card sx={{
      background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
      border: '1px solid #2a2d3a',
      borderRadius: 2,
      '&:hover': {
        borderColor: color,
        boxShadow: `0 0 20px ${color}20`
      },
      transition: 'all 0.3s ease'
    }}>
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading DeFi data...</Typography>
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
          DeFi Analytics
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

      {/* DeFi Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Value Locked"
            value={formatCurrency(defiStats?.tvl || 1950000)}
            change={12.5}
            icon={WalletIcon}
            color="#00eaff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="24h Volume"
            value={formatCurrency(defiStats?.volume24h || 847000)}
            change={8.2}
            icon={SwapIcon}
            color="#4ecdc4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Protocols"
            value={defiStats?.activeProtocols || '24'}
            change={4.1}
            icon={ChartIcon}
            color="#ffd93d"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. APY"
            value={`${defiStats?.avgApy || '8.7'}%`}
            change={-2.3}
            icon={YieldIcon}
            color="#ff6b6b"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
            border: '1px solid #2a2d3a',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                TVL Trend (6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tvlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="name" stroke="#b2ebf2" />
                  <YAxis stroke="#b2ebf2" tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2d3a',
                      borderRadius: 8
                    }}
                    formatter={(value) => [formatCurrency(value), 'TVL']}
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
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(22, 33, 62, 0.8) 100%)',
            border: '1px solid #2a2d3a',
            borderRadius: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
                Top Yields by APY
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yieldData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="name" stroke="#b2ebf2" />
                  <YAxis stroke="#b2ebf2" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2a2d3a',
                      borderRadius: 8
                    }}
                    formatter={(value) => [`${value}%`, 'APY']}
                  />
                  <Bar dataKey="apy" fill="#4ecdc4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed data */}
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
          <Tab label="Liquidity Pools" />
          <Tab label="Yield Opportunities" />
          <Tab label="Protocols" />
        </Tabs>

        {/* Liquidity Pools Tab */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Pool</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Tokens</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>TVL</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>APY</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Volume 24h</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pools.map((pool) => (
                  <TableRow
                    key={pool.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        <PoolIcon sx={{ color: '#00eaff', mr: 1, fontSize: 18 }} />
                        {pool.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>
                      {pool.tokens.join(' / ')}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {formatCurrency(pool.tvl)}
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', fontWeight: 600 }}>
                      {pool.apy}%
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {formatCurrency(pool.volume24h)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pool.status}
                        size="small"
                        sx={{
                          backgroundColor: pool.status === 'active' ? '#4caf50' : '#ff9800',
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

        {/* Yield Opportunities Tab */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Protocol</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Asset</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>APY</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>TVL</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Risk</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yields.map((yield_) => (
                  <TableRow
                    key={`${yield_.protocol}-${yield_.asset}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#00eaff' }}>
                          {yield_.protocol[0]}
                        </Avatar>
                        {yield_.protocol}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>
                      {yield_.asset}
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', fontWeight: 600 }}>
                      {yield_.apy}%
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {formatCurrency(yield_.tvl)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={yield_.risk}
                        size="small"
                        sx={{
                          backgroundColor:
                            yield_.risk === 'Low' ? '#4caf50' :
                              yield_.risk === 'Medium' ? '#ff9800' : '#f44336',
                          color: '#ffffff'
                        }}
                      />
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
                        Deposit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Protocols Tab */}
        {activeTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Protocol</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>TVL</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Users</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>24h Change</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {protocols.map((protocol) => (
                  <TableRow
                    key={protocol.name}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#00eaff' }}>
                          {protocol.name[0]}
                        </Avatar>
                        {protocol.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2' }}>
                      {protocol.category}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {formatCurrency(protocol.tvl)}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {protocol.users?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {protocol.change24h > 0 ? (
                          <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: '#f44336', fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: protocol.change24h > 0 ? '#4caf50' : '#f44336',
                            fontWeight: 500
                          }}
                        >
                          {Math.abs(protocol.change24h)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={protocol.status}
                        size="small"
                        sx={{
                          backgroundColor: protocol.status === 'active' ? '#4caf50' : '#ff9800',
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
      </Card>
    </Box>
  );
};

export default Defi;