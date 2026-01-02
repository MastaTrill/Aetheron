/* global chrome */
/**
 * Injected Provider Script
 * Provides window.ethereum API for dApps
 */

(function () {
  'use strict';

  let requestId = 0;
  const pendingRequests = new Map();

  /**
   * Aetheron Provider
   */
  class AetheronProvider {
    constructor() {
      this.isAetheron = true;
      this.isMetaMask = true; // For compatibility
      this.chainId = '0x1';
      this.networkVersion = '1';
      this.selectedAddress = null;
      this._eventListeners = new Map();
    }

    /**
     * Request method (EIP-1193)
     */
    async request({ method, params = [] }) {
      return new Promise((resolve, reject) => {
        const id = ++requestId;

        pendingRequests.set(id, { resolve, reject });

        window.postMessage(
          {
            type: 'AETHERON_REQUEST',
            id,
            method,
            params
          },
          '*'
        );

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error('Request timeout'));
          }
        }, 30000);
      });
    }

    /**
     * Enable (legacy)
     */
    async enable() {
      const accounts = await this.request({ method: 'eth_requestAccounts' });
      this.selectedAddress = accounts[0];
      return accounts;
    }

    /**
     * Send (legacy)
     */
    send(methodOrPayload, paramsOrCallback) {
      if (typeof methodOrPayload === 'string') {
        return this.request({
          method: methodOrPayload,
          params: paramsOrCallback
        });
      }

      if (typeof paramsOrCallback === 'function') {
        this.sendAsync(methodOrPayload, paramsOrCallback);
        return;
      }

      return this.request(methodOrPayload);
    }

    /**
     * Send async (legacy)
     */
    async sendAsync(payload, callback) {
      try {
        const result = await this.request({
          method: payload.method,
          params: payload.params || []
        });
        callback(null, {
          id: payload.id,
          jsonrpc: '2.0',
          result
        });
      } catch (error) {
        callback(error, null);
      }
    }

    /**
     * Event listeners (EIP-1193)
     */
    on(event, callback) {
      if (!this._eventListeners.has(event)) {
        this._eventListeners.set(event, []);
      }
      this._eventListeners.get(event).push(callback);
    }

    removeListener(event, callback) {
      const listeners = this._eventListeners.get(event);
      if (!listeners) return;

      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    emit(event, ...args) {
      const listeners = this._eventListeners.get(event);
      if (!listeners) return;

      listeners.forEach((callback) => callback(...args));
    }

    /**
     * Check if connected
     */
    isConnected() {
      return true;
    }
  }

  // Create provider instance
  const provider = new AetheronProvider();

  // Listen for responses
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data.type || event.data.type !== 'AETHERON_RESPONSE') return;

    const { id, result, error } = event.data;
    const pending = pendingRequests.get(id);

    if (!pending) return;

    pendingRequests.delete(id);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  });

  // Inject provider into window
  Object.defineProperty(window, 'ethereum', {
    value: provider,
    writable: false,
    configurable: false
  });

  // Also inject as window.aetheron
  Object.defineProperty(window, 'aetheron', {
    value: provider,
    writable: false,
    configurable: false
  });

  // Announce provider
  window.dispatchEvent(new Event('ethereum#initialized'));

  console.log('Aetheron Wallet provider injected');
})();
