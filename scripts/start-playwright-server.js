import { httpServer } from '../test-app.js';

// Listen on the HTTP server that also carries the WebSocket server, so the
// dashboard's real-time connection works during E2E runs.
const server = httpServer.listen(3001, '127.0.0.1', () => {
  console.log('Playwright test server listening on http://127.0.0.1:3001');
});

server.on('error', (error) => {
  console.error('Playwright test server failed to start:', error);
  process.exitCode = 1;
});
