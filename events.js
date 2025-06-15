// Event system for blockchain notifications
const EventEmitter = require('events');
class BlockchainEvents extends EventEmitter {}
const blockchainEvents = new BlockchainEvents();

module.exports = { blockchainEvents };
