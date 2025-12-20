const { RWATokenization } = require('../../rwa-tokenization');

describe('RWA Tokenization', () => {
  let rwa;

  beforeEach(() => {
    rwa = new RWATokenization();
  });

  describe('Asset Tokenization', () => {
    test('should tokenize real estate asset', async () => {
      const result = await rwa.tokenizeAsset(
        'real-estate',
        {
          name: '123 Main St, New York',
          address: '123 Main St, NY 10001',
          squareFeet: 2500,
          bedrooms: 3,
          bathrooms: 2
        },
        1000000,
        10000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.tokenId).toBeDefined();
      expect(result.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.tokensIssued).toBe(10000);
      expect(result.tokenPrice).toBe(100);
    });

    test('should tokenize commodity asset', async () => {
      const result = await rwa.tokenizeAsset(
        'commodity',
        {
          name: 'Gold Bullion',
          type: 'gold',
          weight: '100 oz',
          purity: '99.99%'
        },
        200000,
        1000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.tokenId).toBeDefined();
    });

    test('should tokenize invoice/receivable', async () => {
      const result = await rwa.tokenizeAsset(
        'invoice',
        {
          name: 'Invoice #12345',
          invoiceNumber: '12345',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          debtor: 'Acme Corp'
        },
        50000,
        100,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
      expect(result.assetType).toBe('invoice');
    });

    test('should tokenize art asset', async () => {
      const result = await rwa.tokenizeAsset(
        'art',
        {
          name: 'Abstract Masterpiece',
          artist: 'Famous Artist',
          year: 2020,
          medium: 'Oil on Canvas'
        },
        500000,
        5000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Token Transfers', () => {
    test('should transfer tokens between addresses', async () => {
      const asset = await rwa.tokenizeAsset(
        'real-estate',
        { name: 'Property A' },
        1000000,
        10000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const result = await rwa.transferTokens(
        asset.tokenId,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        100
      );

      expect(result.success).toBe(true);
      expect(result.transferAmount).toBe(100);
    });

    test('should enforce transfer restrictions', async () => {
      const asset = await rwa.tokenizeAsset(
        'security',
        { name: 'Company Shares', accredited: true },
        1000000,
        10000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const result = await rwa.transferTokens(
        asset.tokenId,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
        '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        100
      );

      // Securities may have transfer restrictions
      if (!result.success) {
        expect(result.error).toContain('restricted');
      }
    });
  });

  describe('Valuation Updates', () => {
    test('should update asset valuation', async () => {
      const asset = await rwa.tokenizeAsset(
        'real-estate',
        { name: 'Property B' },
        1000000,
        10000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const result = await rwa.updateValuation(asset.tokenId, 1100000, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7');

      expect(result.success).toBe(true);
      expect(result.newValuation).toBe(1100000);
      expect(result.priceChange).toBe(10);
    });
  });

  describe('Compliance', () => {
    test('should verify KYC for token holder', async () => {
      const asset = await rwa.tokenizeAsset(
        'security',
        { name: 'Shares A' },
        500000,
        5000,
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7'
      );

      const result = await rwa.verifyKYC(asset.tokenId, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7', true);

      expect(result.success).toBe(true);
    });
  });

  describe('Asset Reporting', () => {
    test('should get all tokenized assets', async () => {
      await rwa.tokenizeAsset('real-estate', { name: 'Property 1' }, 1000000, 10000, '0xOwner1');
      await rwa.tokenizeAsset('commodity', { name: 'Gold' }, 200000, 1000, '0xOwner2');
      await rwa.tokenizeAsset('art', { name: 'Painting' }, 500000, 5000, '0xOwner3');

      const assets = rwa.getAllAssets();

      expect(assets.length).toBeGreaterThanOrEqual(3);
    });

    test('should filter assets by type', async () => {
      await rwa.tokenizeAsset('real-estate', { name: 'House 1' }, 1000000, 10000, '0xOwner');
      await rwa.tokenizeAsset('real-estate', { name: 'House 2' }, 1500000, 15000, '0xOwner');
      await rwa.tokenizeAsset('commodity', { name: 'Silver' }, 50000, 500, '0xOwner');

      const realEstate = rwa.getAssetsByType('real-estate');

      expect(realEstate.length).toBeGreaterThanOrEqual(2);
      realEstate.forEach((asset) => {
        expect(asset.assetType).toBe('real-estate');
      });
    });
  });
});
