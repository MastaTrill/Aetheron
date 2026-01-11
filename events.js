// Event system for blockchain notifications
import EventEmitter from 'events';
class BlockchainEvents extends EventEmitter {}
const blockchainEvents = new BlockchainEvents();

export { blockchainEvents };
