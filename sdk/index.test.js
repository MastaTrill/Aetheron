import test from 'node:test';
import assert from 'node:assert/strict';
import { AetheronSDK } from './index.js';

test('AetheronSDK initializes with v1.1.0 and Sentinel L3 methods', () => {
  const sdk = new AetheronSDK({ apiUrl: 'http://localhost:3001', apiKey: 'test-key' });
  assert.equal(sdk.version, '1.1.0');
  assert.equal(typeof sdk.getSentinelHealth, 'function');
  assert.equal(typeof sdk.evaluateBridgeRisk, 'function');
  assert.equal(typeof sdk.submitL3RelayMessage, 'function');
  assert.equal(typeof sdk.getL3RelayMessageStatus, 'function');
});

test('AetheronSDK Sentinel L3 methods route requests accurately', async () => {
  const sdk = new AetheronSDK({ apiUrl: 'http://sentinel.local' });
  const calls = [];
  sdk.request = async (method, path, data) => {
    calls.push({ method, path, data });
    if (path === '/api/sentinel/health') {
      return { systemHealthy: true, killSwitchActive: false, activePolicyPack: 'v2.0-tight', chainId: 84532 };
    }
    if (path === '/api/sentinel/evaluate') {
      return { action: 'ALLOW', risk_score: 0.08, reasons: [], controls: ['monitor'], escalate: false };
    }
    if (path === '/api/l3relay/messages') {
      return { messageHash: '0xabc123', status: 'PENDING' };
    }
    return { ok: true };
  };

  const health = await sdk.getSentinelHealth();
  assert.equal(health.systemHealthy, true);
  assert.equal(health.killSwitchActive, false);
  assert.equal(health.activePolicyPack, 'v2.0-tight');
  assert.equal(health.chainId, 84532);

  const decision = await sdk.evaluateBridgeRisk({
    amount: 100,
    available_liquidity: 50000,
    velocity_1h: 200,
    velocity_24h: 9600,
    anomaly_score: 0.02,
    signer_quorum_ratio: 1.0
  });
  assert.equal(decision.action, 'ALLOW');

  const relayRes = await sdk.submitL3RelayMessage('0xdeadbeef');
  assert.equal(relayRes.messageHash, '0xabc123');
  assert.equal(calls.length, 3);
});
