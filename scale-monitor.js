#!/usr/bin/env node

/**
 * Aetheron Scale Preparation & Monitoring Tools
 * Performance monitoring, load testing, and optimization utilities
 */

import express from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.MONITOR_PORT || 3002;

// Middleware
app.use(express.json());

// Metrics storage
let metrics = {
  system: {},
  performance: {},
  errors: [],
  uptime: process.uptime(),
  startTime: Date.now()
};

// System monitoring
function collectSystemMetrics() {
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: process.cpuUsage(),
      load: os.loadavg()
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      process: process.memoryUsage()
    },
    disk: getDiskUsage(),
    network: getNetworkStats(),
    platform: {
      os: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime()
    }
  };
}

function getDiskUsage() {
  try {
    const stats = fs.statSync('/');
    return {
      total: stats.size || 0,
      free: 0, // Would need more complex implementation
      used: 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

function getNetworkStats() {
  const interfaces = os.networkInterfaces();
  const stats = {};

  for (const [name, addresses] of Object.entries(interfaces)) {
    stats[name] = addresses.map(addr => ({
      address: addr.address,
      family: addr.family,
      internal: addr.internal
    }));
  }

  return stats;
}

// Performance monitoring
async function runPerformanceTest() {
  console.log('🏃 Running performance tests...');

  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Memory leak test
  results.tests.memoryLeak = await testMemoryLeak();

  // Response time test
  results.tests.responseTime = await testResponseTime();

  // Load test
  results.tests.loadTest = await testLoadHandling();

  return results;
}

async function testMemoryLeak() {
  const initialMemory = process.memoryUsage().heapUsed;
  const iterations = 1000;

  // Simulate memory operations
  const data = [];
  for (let i = 0; i < iterations; i++) {
    data.push({ id: i, data: 'x'.repeat(1000) });
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  return {
    initial: initialMemory,
    final: finalMemory,
    increase: memoryIncrease,
    increaseMB: (memoryIncrease / 1024 / 1024).toFixed(2),
    status: memoryIncrease < 10 * 1024 * 1024 ? 'PASS' : 'WARN' // Less than 10MB increase
  };
}

async function testResponseTime() {
  const url = 'http://localhost:3000'; // Main app server
  const requests = 10;
  const times = [];

  for (let i = 0; i < requests; i++) {
    const start = Date.now();
    try {
      await fetch(url);
      times.push(Date.now() - start);
    } catch (error) {
      times.push(-1); // Error
    }
  }

  const validTimes = times.filter(t => t > 0);
  const avgTime = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
  const maxTime = Math.max(...validTimes);
  const minTime = Math.min(...validTimes);

  return {
    requests,
    successful: validTimes.length,
    avgResponseTime: avgTime.toFixed(2),
    maxResponseTime: maxTime,
    minResponseTime: minTime,
    status: avgTime < 1000 ? 'PASS' : 'WARN' // Less than 1 second average
  };
}

async function testLoadHandling() {
  const concurrent = 50;
  const url = 'http://localhost:3000';
  const promises = [];

  for (let i = 0; i < concurrent; i++) {
    promises.push(fetch(url).catch(() => ({ ok: false })));
  }

  const start = Date.now();
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  const successful = results.filter(r => r.ok).length;

  return {
    concurrent,
    successful,
    failed: concurrent - successful,
    duration,
    successRate: ((successful / concurrent) * 100).toFixed(1) + '%',
    status: successful >= concurrent * 0.95 ? 'PASS' : 'WARN' // 95% success rate
  };
}

// Routes
app.get('/api/monitor/system', (req, res) => {
  const systemMetrics = collectSystemMetrics();
  metrics.system = systemMetrics;
  res.json({ success: true, metrics: systemMetrics });
});

app.get('/api/monitor/performance', async (req, res) => {
  try {
    const perfResults = await runPerformanceTest();
    metrics.performance = perfResults;
    res.json({ success: true, results: perfResults });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/monitor/error', (req, res) => {
  const { message, stack, userAgent, url, userId } = req.body;

  const error = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    message,
    stack,
    userAgent,
    url,
    userId: userId || 'anonymous'
  };

  metrics.errors.push(error);

  // Keep only last 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors = metrics.errors.slice(-100);
  }

  console.log('🚨 Error logged:', message);
  res.json({ success: true, id: error.id });
});

app.get('/api/monitor/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      ...metrics,
      currentUptime: process.uptime(),
      totalUptime: (Date.now() - metrics.startTime) / 1000
    }
  });
});

app.get('/api/monitor/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    version: process.version
  };

  res.json(health);
});

// Dashboard
app.get('/monitor', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aetheron Scale Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #0f2027; color: white; }
        .container { max-width: 1400px; margin: 0 auto; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
        .metric { text-align: center; margin: 10px 0; }
        .value { font-size: 2em; font-weight: bold; color: #00eaff; }
        .label { font-size: 0.9em; opacity: 0.8; }
        .status-good { color: #4CAF50; }
        .status-warn { color: #FF9800; }
        .status-bad { color: #f44336; }
        button { background: #00eaff; color: #0f2027; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .test-results { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 5px; margin: 10px 0; }
        .error-list { max-height: 300px; overflow-y: auto; }
        .error-item { background: rgba(255,0,0,0.1); padding: 10px; margin: 5px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Aetheron Scale Monitor</h1>

        <div class="grid">
            <div class="card">
                <h3>System Health</h3>
                <div id="systemMetrics"></div>
            </div>

            <div class="card">
                <h3>Performance Tests</h3>
                <button onclick="runPerfTests()">🏃 Run Tests</button>
                <div id="perfResults"></div>
            </div>

            <div class="card">
                <h3>Error Tracking</h3>
                <div id="errorCount"></div>
                <div class="error-list" id="errorList"></div>
            </div>

            <div class="card">
                <h3>Quick Actions</h3>
                <button onclick="checkHealth()">❤️ Health Check</button>
                <button onclick="exportMetrics()">📥 Export Data</button>
                <button onclick="clearErrors()">🗑️ Clear Errors</button>
            </div>
        </div>
    </div>

    <script>
        async function loadSystemMetrics() {
            try {
                const response = await fetch('/api/monitor/system');
                const data = await response.json();
                displaySystemMetrics(data.metrics);
            } catch (error) {
                console.error('Error loading system metrics:', error);
            }
        }

        function displaySystemMetrics(metrics) {
            const div = document.getElementById('systemMetrics');
            const memUsage = (metrics.memory.used / metrics.memory.total * 100).toFixed(1);
            const memStatus = memUsage < 80 ? 'good' : memUsage < 90 ? 'warn' : 'bad';

            div.innerHTML = \`
                <div class="metric">
                    <div class="value \${memStatus}">\${memUsage}%</div>
                    <div class="label">Memory Usage</div>
                </div>
                <div class="metric">
                    <div class="value">\${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB</div>
                    <div class="label">Memory Used</div>
                </div>
                <div class="metric">
                    <div class="value">\${metrics.cpu.load[0].toFixed(2)}</div>
                    <div class="label">CPU Load (1m)</div>
                </div>
                <div class="metric">
                    <div class="value">\${Math.floor(metrics.platform.uptime / 3600)}h</div>
                    <div class="label">System Uptime</div>
                </div>
            \`;
        }

        async function runPerfTests() {
            const button = event.target;
            button.disabled = true;
            button.textContent = 'Running...';

            try {
                const response = await fetch('/api/monitor/performance');
                const data = await response.json();
                displayPerfResults(data.results);
            } catch (error) {
                console.error('Error running performance tests:', error);
            } finally {
                button.disabled = false;
                button.textContent = '🏃 Run Tests';
            }
        }

        function displayPerfResults(results) {
            const div = document.getElementById('perfResults');
            let html = '';

            for (const [test, result] of Object.entries(results.tests)) {
                const statusClass = result.status === 'PASS' ? 'good' : 'warn';
                html += \`<div class="test-results">
                    <strong>\${test}:</strong> <span class="status-\${statusClass}">\${result.status}</span><br>\`;

                if (test === 'memoryLeak') {
                    html += \`Memory increase: \${result.increaseMB}MB<br>\`;
                } else if (test === 'responseTime') {
                    html += \`Avg response: \${result.avgResponseTime}ms (\${result.successful}/\${result.requests} successful)<br>\`;
                } else if (test === 'loadTest') {
                    html += \`Success rate: \${result.successRate} (\${result.successful}/\${result.concurrent})<br>\`;
                }

                html += '</div>';
            }

            div.innerHTML = html;
        }

        async function loadErrors() {
            try {
                const response = await fetch('/api/monitor/metrics');
                const data = await response.json();

                const errorCount = data.metrics.errors.length;
                document.getElementById('errorCount').innerHTML = \`
                    <div class="metric">
                        <div class="value \${errorCount > 10 ? 'bad' : errorCount > 5 ? 'warn' : 'good'}">\${errorCount}</div>
                        <div class="label">Total Errors</div>
                    </div>
                \`;

                const errorList = data.metrics.errors.slice(-5).reverse();
                const listDiv = document.getElementById('errorList');
                listDiv.innerHTML = errorList.map(error => \`
                    <div class="error-item">
                        <strong>\${error.message}</strong><br>
                        <small>\${new Date(error.timestamp).toLocaleString()}</small>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Error loading errors:', error);
            }
        }

        async function checkHealth() {
            try {
                const response = await fetch('/api/monitor/health');
                const health = await response.json();
                alert(\`Health Check: \${health.status.toUpperCase()}\\nUptime: \${Math.floor(health.uptime / 3600)}h \${Math.floor((health.uptime % 3600) / 60)}m\`);
            } catch (error) {
                alert('Health check failed: ' + error.message);
            }
        }

        function exportMetrics() {
            window.open('/api/monitor/metrics', '_blank');
        }

        async function clearErrors() {
            if (confirm('Clear all error logs?')) {
                // This would need a clear endpoint
                alert('Error clearing not implemented yet');
            }
        }

        // Load data on page load
        loadSystemMetrics();
        loadErrors();

        // Refresh every 30 seconds
        setInterval(() => {
            loadSystemMetrics();
            loadErrors();
        }, 30000);
    </script>
</body>
</html>`;
  res.send(html);
});

// Start monitoring server
app.listen(PORT, () => {
  console.log(`📊 Aetheron Scale Monitor running on port ${PORT}`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/monitor`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/monitor/health`);
  console.log(`📊 Metrics API: http://localhost:${PORT}/api/monitor/metrics`);
});

export default app;
