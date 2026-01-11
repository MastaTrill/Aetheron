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
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  AccountBalance as NetworkIcon,
  Block as BlockIcon,
  Receipt as TransactionIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

const Blockchain = () => {
  const { api } = useApi();
  const { subscribe, unsubscribe } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);
  const [networkStats, setNetworkStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBlockchainData();

    // Subscribe to real-time blockchain updates
    const handleBlockUpdate = (data) => {
      setBlocks((prev) => [data, ...prev.slice(0, 19)]);
      setNetworkStats((prev) => ({ ...prev, latestBlock: data.number }));
    };

    const handleTransactionUpdate = (data) => {
      setTransactions((prev) => [data, ...prev.slice(0, 19)]);
    };

    subscribe('newBlock', handleBlockUpdate);
    subscribe('newTransaction', handleTransactionUpdate);

    return () => {
      unsubscribe('newBlock', handleBlockUpdate);
      unsubscribe('newTransaction', handleTransactionUpdate);
    };
  }, []);

  const loadBlockchainData = async () => {
    try {
      setLoading(true);
      const [statsResponse, blocksResponse, txResponse] = await Promise.all([
        api.get('/api/blockchain/stats'),
        api.get('/api/blockchain/blocks?limit=20'),
        api.get('/api/blockchain/transactions?limit=20')
      ]);

      setNetworkStats(statsResponse.data);
      setBlocks(blocksResponse.data);
      setTransactions(txResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load blockchain data');
      console.error('Blockchain data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBlockchainData();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
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
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.5 }}>
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
        <Typography>Loading blockchain data...</Typography>
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
          Blockchain Explorer
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

      {/* Network Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Latest Block"
            value={networkStats?.latestBlock || '#18,247,891'}
            subtitle="2 seconds ago"
            icon={BlockIcon}
            color="#00eaff"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Network TPS"
            value={networkStats?.tps || '15.2'}
            subtitle="Transactions/sec"
            icon={SpeedIcon}
            color="#4ecdc4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gas Price"
            value={networkStats?.gasPrice || '25'}
            subtitle="Gwei"
            icon={MemoryIcon}
            color="#ffd93d"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Nodes"
            value={networkStats?.activeNodes || '8,432'}
            subtitle="Connected"
            icon={NetworkIcon}
            color="#ff6b6b"
          />
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by transaction hash, block number, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8892a0' }} />
              </InputAdornment>
            )
          }}
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
              color: '#ffffff',
              '&::placeholder': {
                color: '#8892a0'
              }
            }
          }}
        />
      </Box>

      {/* Tabs */}
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
          <Tab label="Blocks" />
          <Tab label="Transactions" />
        </Tabs>

        {/* Blocks Tab */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Block</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Hash</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Transactions</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow
                    key={block.number}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        <BlockIcon sx={{ color: '#00eaff', mr: 1, fontSize: 18 }} />
                        {block.number}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                      {formatAddress(block.hash)}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{block.transactions}</TableCell>
                    <TableCell sx={{ color: '#8892a0' }}>
                      {formatTimestamp(block.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Confirmed"
                        size="small"
                        sx={{
                          backgroundColor: '#4caf50',
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

        {/* Transactions Tab */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Hash</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>From</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>To</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Value</TableCell>
                  <TableCell sx={{ color: '#b2ebf2', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow
                    key={tx.hash}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 234, 255, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#b2ebf2', fontFamily: 'monospace' }}>
                      <Box display="flex" alignItems="center">
                        <TransactionIcon sx={{ color: '#4ecdc4', mr: 1, fontSize: 18 }} />
                        {formatAddress(tx.hash)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                      {formatAddress(tx.from)}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                      {formatAddress(tx.to)}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{tx.value} ETH</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        size="small"
                        color={getStatusColor(tx.status)}
                        sx={{ color: '#ffffff' }}
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

export default Blockchain;
