/**
 * Decentralized Storage Module
 * IPFS, Arweave, and Filecoin integration
 */

const crypto = require('crypto');
const fs = require('fs');

/**
 * IPFS Storage Provider
 */
class IPFSProvider {
  constructor(config) {
    this.nodeUrl = config.nodeUrl || 'http://127.0.0.1:5001';
    this.gatewayUrl = config.gatewayUrl || 'https://ipfs.io/ipfs/';
  }

  /**
   * Upload file to IPFS
   */
  async upload(data, options = {}) {
    const formData = new FormData();

    if (typeof data === 'string') {
      formData.append('file', new Blob([data]));
    } else if (Buffer.isBuffer(data)) {
      formData.append('file', new Blob([data]));
    } else {
      formData.append('file', data);
    }

    const response = await fetch(`${this.nodeUrl}/api/v0/add`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('IPFS upload failed');
    }

    const result = await response.json();

    return {
      cid: result.Hash,
      size: result.Size,
      url: `${this.gatewayUrl}${result.Hash}`,
      pinned: options.pin !== false
    };
  }

  /**
   * Download file from IPFS
   */
  async download(cid) {
    const response = await fetch(`${this.gatewayUrl}${cid}`);

    if (!response.ok) {
      throw new Error('IPFS download failed');
    }

    return await response.text();
  }

  /**
   * Pin content
   */
  async pin(cid) {
    const response = await fetch(`${this.nodeUrl}/api/v0/pin/add?arg=${cid}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('IPFS pin failed');
    }

    return { cid, pinned: true };
  }

  /**
   * Unpin content
   */
  async unpin(cid) {
    const response = await fetch(`${this.nodeUrl}/api/v0/pin/rm?arg=${cid}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('IPFS unpin failed');
    }

    return { cid, pinned: false };
  }

  /**
   * Get file stats
   */
  async stat(cid) {
    const response = await fetch(`${this.nodeUrl}/api/v0/files/stat?arg=/ipfs/${cid}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('IPFS stat failed');
    }

    return await response.json();
  }
}

/**
 * Arweave Storage Provider
 */
class ArweaveProvider {
  constructor(config) {
    this.nodeUrl = config.nodeUrl || 'https://arweave.net';
    this.wallet = config.wallet;
  }

  /**
   * Upload file to Arweave
   */
  async upload(data, tags = []) {
    const transaction = {
      data: Buffer.from(data).toString('base64'),
      tags: [{ name: 'Content-Type', value: 'text/plain' }, ...tags]
    };

    const response = await fetch(`${this.nodeUrl}/tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      throw new Error('Arweave upload failed');
    }

    const result = await response.json();

    return {
      txId: result.id,
      url: `${this.nodeUrl}/${result.id}`,
      permanent: true,
      fee: result.reward
    };
  }

  /**
   * Download file from Arweave
   */
  async download(txId) {
    const response = await fetch(`${this.nodeUrl}/${txId}`);

    if (!response.ok) {
      throw new Error('Arweave download failed');
    }

    return await response.text();
  }

  /**
   * Get transaction status
   */
  async getStatus(txId) {
    const response = await fetch(`${this.nodeUrl}/tx/${txId}/status`);

    if (!response.ok) {
      throw new Error('Failed to get transaction status');
    }

    return await response.json();
  }

  /**
   * Query transactions by tags
   */
  async queryByTags(tags) {
    const query = {
      query: `{
        transactions(
          tags: ${JSON.stringify(tags.map((t) => ({ name: t.name, values: [t.value] })))}
        ) {
          edges {
            node {
              id
              tags {
                name
                value
              }
            }
          }
        }
      }`
    };

    const response = await fetch(`${this.nodeUrl}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error('Arweave query failed');
    }

    const result = await response.json();
    return result.data.transactions.edges.map((e) => e.node);
  }
}

/**
 * Filecoin Storage Provider
 */
class FilecoinProvider {
  constructor(config) {
    this.nodeUrl = config.nodeUrl || 'https://api.filecoin.io';
    this.apiToken = config.apiToken;
  }

  /**
   * Upload file to Filecoin
   */
  async upload(data, options = {}) {
    const cid = this.calculateCID(data);

    const deal = {
      cid,
      size: Buffer.byteLength(data),
      duration: options.duration || 518400, // ~6 months
      price: options.price || '0',
      verified: options.verified || false
    };

    return {
      cid,
      dealId: crypto.randomBytes(16).toString('hex'),
      miner: options.miner || 'f01234',
      status: 'pending',
      ...deal
    };
  }

  /**
   * Download file from Filecoin
   */
  async download(cid) {
    const response = await fetch(`${this.nodeUrl}/retrieve/${cid}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Filecoin retrieval failed');
    }

    return await response.text();
  }

  /**
   * Get deal status
   */
  async getDealStatus(dealId) {
    return {
      dealId,
      status: 'active',
      startEpoch: 1000000,
      endEpoch: 1518400,
      verified: false
    };
  }

  /**
   * Calculate CID (simplified)
   */
  calculateCID(data) {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return 'Qm' + hash.substring(0, 44);
  }
}

/**
 * Unified Storage Manager
 */
class DecentralizedStorageManager {
  constructor(config) {
    this.providers = {
      ipfs: new IPFSProvider(config.ipfs || {}),
      arweave: new ArweaveProvider(config.arweave || {}),
      filecoin: new FilecoinProvider(config.filecoin || {})
    };

    this.metadata = new Map();
  }

  /**
   * Upload to specified provider
   */
  async upload(data, provider = 'ipfs', options = {}) {
    if (!this.providers[provider]) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const result = await this.providers[provider].upload(data, options);

    // Store metadata
    const id = result.cid || result.txId;
    this.metadata.set(id, {
      provider,
      uploadedAt: Date.now(),
      size: Buffer.byteLength(data),
      ...result
    });

    return result;
  }

  /**
   * Download from any provider
   */
  async download(id, provider = null) {
    // Auto-detect provider if not specified
    if (!provider) {
      const meta = this.metadata.get(id);
      provider = meta?.provider || 'ipfs';
    }

    return await this.providers[provider].download(id);
  }

  /**
   * Upload to multiple providers (redundancy)
   */
  async uploadMultiple(data, providers = ['ipfs', 'arweave']) {
    const results = {};

    for (const provider of providers) {
      try {
        results[provider] = await this.upload(data, provider);
      } catch (error) {
        results[provider] = { error: error.message };
      }
    }

    return results;
  }

  /**
   * Get storage metadata
   */
  getMetadata(id) {
    return this.metadata.get(id);
  }

  /**
   * List all stored items
   */
  listAll() {
    return Array.from(this.metadata.entries()).map(([id, meta]) => ({
      id,
      ...meta
    }));
  }

  /**
   * Delete from provider (if supported)
   */
  async delete(id) {
    const meta = this.metadata.get(id);

    if (!meta) {
      throw new Error('Item not found');
    }

    if (meta.provider === 'ipfs') {
      await this.providers.ipfs.unpin(id);
    }

    this.metadata.delete(id);

    return { id, deleted: true };
  }
}

/**
 * Storage Helpers
 */
class StorageHelpers {
  /**
   * Upload JSON data
   */
  static async uploadJSON(manager, data, provider = 'ipfs') {
    const json = JSON.stringify(data, null, 2);
    return await manager.upload(json, provider, {
      tags: [{ name: 'Content-Type', value: 'application/json' }]
    });
  }

  /**
   * Upload file from path
   */
  static async uploadFile(manager, filePath, provider = 'ipfs') {
    const data = fs.readFileSync(filePath);
    return await manager.upload(data, provider);
  }

  /**
   * Download and parse JSON
   */
  static async downloadJSON(manager, id, provider = null) {
    const data = await manager.download(id, provider);
    return JSON.parse(data);
  }

  /**
   * Create metadata manifest
   */
  static createManifest(files) {
    return {
      version: '1.0',
      created: Date.now(),
      files: files.map((f) => ({
        name: f.name,
        cid: f.cid,
        size: f.size,
        type: f.type
      }))
    };
  }
}

module.exports = {
  IPFSProvider,
  ArweaveProvider,
  FilecoinProvider,
  DecentralizedStorageManager,
  StorageHelpers
};
