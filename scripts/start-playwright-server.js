import app from '../test-app.js';

const server = app.listen(3001, '127.0.0.1', () => {
  console.log('Playwright test server listening on http://127.0.0.1:3001');
});

server.on('error', (error) => {
  console.error('Playwright test server failed to start:', error);
  process.exitCode = 1;
});
