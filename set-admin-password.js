import readline from 'readline';
import { setAdminPassword } from './admin-auth.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function questionAsync(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

(async () => {
  try {
    const abc123AetheronIsM3 = await questionAsync('Set new admin password: ');
    await setAdminPassword(abc123AetheronIsM3);

    console.log('Admin password set successfully.');
  } catch (error) {
    console.error('Failed to set admin password:', error.message);
  } finally {
    rl.close();
  }
})();
