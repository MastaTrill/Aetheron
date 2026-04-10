import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE_TTL = 60000;

class PriceOracle {
  constructor() {
    this.priceCache = new Map();
    this.cacheExpiry = new Map();
  }

  async getPrice(tokenId) {
    const now = Date.now();
    const cached = this.priceCache.get(tokenId);
    const expiry = this.cacheExpiry.get(tokenId);

    if (cached && expiry && now < expiry) {
      return cached;
    }

    try {
      const idMap = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'AETH': 'aetheron',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'MATIC': 'matic-network',
        'BASE': 'base',
        'ARB': 'arbitrum'
      };

      const coingeckoId = idMap[tokenId.toUpperCase()] || tokenId.toLowerCase();
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: { ids: coingeckoId, vs_currencies: 'usd' },
        timeout: 10000
      });

      const price = response.data[coingeckoId]?.usd || 0;
      this.priceCache.set(tokenId, price);
      this.cacheExpiry.set(tokenId, now + PRICE_CACHE_TTL);

      return price;
    } catch (error) {
      console.error(`[Oracle] Failed to fetch ${tokenId} price:`, error.message);
      return this.priceCache.get(tokenId) || 0;
    }
  }

  async getPrices(tokenIds) {
    const prices = {};
    await Promise.all(tokenIds.map(async (id) => {
      prices[id] = await this.getPrice(id);
    }));
    return prices;
  }

  clearCache() {
    this.priceCache.clear();
    this.cacheExpiry.clear();
  }
}

class OracleService {
  constructor() {
    this.priceOracle = new PriceOracle();
  }

  async getTokenPrice(symbol) {
    return this.priceOracle.getPrice(symbol);
  }

  async getMultiplePrices(symbols) {
    return this.priceOracle.getPrices(symbols);
  }

  async getMarketData(tokenId) {
    try {
      const idMap = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'AETH': 'aetheron'
      };
      const id = idMap[tokenId.toUpperCase()] || tokenId;
      const response = await axios.get(`${COINGECKO_API}/coins/${id}`, {
        params: { localization: false, tickers: false, market_data: true, community_data: false, developer_data: false },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('[Oracle] Market data error:', error.message);
      return null;
    }
  }

  async getTrendingCoins() {
    try {
      const response = await axios.get(`${COINGECKO_API}/search/trending`, { timeout: 10000 });
      return response.data.coins.slice(0, 10).map(c => ({
        item: c.item
      }));
    } catch (error) {
      console.error('[Oracle] Trending error:', error.message);
      return [];
    }
  }
}

export { OracleService, PriceOracle };
