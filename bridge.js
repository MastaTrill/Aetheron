import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'bridge.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadData() {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveData(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

class Bridge {
  constructor() {
    this.locked = loadData();
  }

  lock(address, amount) {
    this.locked[address] = (this.locked[address] || 0) + amount;
    saveData(this.locked);
  }

  release(address, amount) {
    if ((this.locked[address] || 0) < amount) throw new Error('Not enough locked');
    this.locked[address] -= amount;
    saveData(this.locked);
  }

  getBalance(address) {
    return this.locked[address] || 0;
  }

  getAllBalances() {
    return this.locked;
  }

  clearAll() {
    this.locked = {};
    saveData(this.locked);
  }
}

class AtomicSwap {
  constructor() {
    this.swaps = [];
  }

  initiateSwap(participantA, participantB, amountA, amountB) {
    this.swaps.push({ participantA, participantB, amountA, amountB, status: 'pending' });
  }

  completeSwap(index) {
    if (this.swaps[index]) this.swaps[index].status = 'complete';
  }
}

export { Bridge, AtomicSwap };
