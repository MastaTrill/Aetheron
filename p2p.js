// Peer-to-peer networking for Aetheron blockchain
const WebSocket = require('ws');
const { Blockchain, Transaction } = require('./blockchain');

const PORT = process.env.P2P_PORT || 6001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const server = new WebSocket.Server({ port: PORT });
let sockets = [];
let chain = new Blockchain();

function _broadcast(_message) {
  sockets.forEach((ws) => ws.send(JSON.stringify(_message)));
}

function connectToPeer(address) {
  const ws = new WebSocket(address);
  ws.on('open', () => initConnection(ws));
}

function initConnection(ws) {
  sockets.push(ws);
  ws.on('message', (data) => handleMessage(ws, data));
  ws.on('close', () => (sockets = sockets.filter((s) => s !== ws)));
  ws.on('error', () => (sockets = sockets.filter((s) => s !== ws)));
  // Send our chain to the new peer
  ws.send(JSON.stringify({ type: 'CHAIN', data: chain.chain }));
}

function handleMessage(ws, data) {
  const msg = JSON.parse(data);
  switch (msg.type) {
  case 'CHAIN':
    if (msg.data.length > chain.chain.length && chain.isChainValid(msg.data)) {
      chain.chain = msg.data;
    }
    break;
  case 'TX': {
    // Accept new transaction
    const tx = Object.assign(new Transaction(), msg.data);
    chain.addTransaction(tx);
    break;
  }
  case 'BLOCK':
    // Accept new block
    // (simple version, real implementation should check validity and fork)
    if (msg.data.previousHash === chain.getLatestBlock().hash) {
      chain.chain.push(msg.data);
      chain.pendingTransactions = [];
    }
    break;
  }
}

server.on('connection', (ws) => initConnection(ws));
peers.forEach(connectToPeer);

console.log('P2P node running on port', PORT);
