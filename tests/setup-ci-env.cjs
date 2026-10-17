// Loaded before test modules so auth remains fail-closed outside Jest.
const crypto = require('node:crypto');
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
  process.env.ADMIN_USERNAME ||= 'aetheron-jest-admin';
  process.env.ADMIN_PASSWORD ||= crypto.randomBytes(32).toString('hex');
}
