const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLFloat,
  GraphQLNonNull
} = require('graphql');
const { PubSub } = require('graphql-subscriptions');

// Create PubSub instance for subscriptions
const pubsub = new PubSub();

// Types
const TransactionType = new GraphQLObjectType({
  name: 'Transaction',
  fields: {
    hash: { type: GraphQLString },
    sender: { type: GraphQLString },
    receiver: { type: GraphQLString },
    amount: { type: GraphQLFloat },
    fee: { type: GraphQLFloat },
    timestamp: { type: GraphQLInt },
    signature: { type: GraphQLString },
    status: { type: GraphQLString }
  }
});

const BlockType = new GraphQLObjectType({
  name: 'Block',
  fields: {
    index: { type: GraphQLInt },
    timestamp: { type: GraphQLInt },
    hash: { type: GraphQLString },
    previousHash: { type: GraphQLString },
    nonce: { type: GraphQLInt },
    difficulty: { type: GraphQLInt },
    miner: { type: GraphQLString },
    transactions: { type: new GraphQLList(TransactionType) },
    transactionCount: {
      type: GraphQLInt,
      resolve: (block) => block.transactions?.length || 0
    }
  }
});

const AddressType = new GraphQLObjectType({
  name: 'Address',
  fields: {
    address: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    transactionCount: { type: GraphQLInt },
    firstSeen: { type: GraphQLInt },
    lastActivity: { type: GraphQLInt }
  }
});

const ChainInfoType = new GraphQLObjectType({
  name: 'ChainInfo',
  fields: {
    name: { type: GraphQLString },
    chainId: { type: GraphQLInt },
    blockHeight: { type: GraphQLInt },
    totalTransactions: { type: GraphQLInt },
    difficulty: { type: GraphQLInt },
    hashRate: { type: GraphQLFloat },
    networkHealth: { type: GraphQLFloat }
  }
});

const NFTType = new GraphQLObjectType({
  name: 'NFT',
  fields: {
    tokenId: { type: GraphQLString },
    owner: { type: GraphQLString },
    metadata: { type: GraphQLString },
    mintedAt: { type: GraphQLInt },
    lastTransfer: { type: GraphQLInt }
  }
});

const ProposalType = new GraphQLObjectType({
  name: 'Proposal',
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    proposer: { type: GraphQLString },
    createdAt: { type: GraphQLInt },
    votesFor: { type: GraphQLInt },
    votesAgainst: { type: GraphQLInt },
    status: { type: GraphQLString }
  }
});

// Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    block: {
      type: BlockType,
      args: { index: { type: new GraphQLNonNull(GraphQLInt) } },
      resolve: async (parent, args, context) => {
        return context.blockchain.chain[args.index];
      }
    },

    latestBlock: {
      type: BlockType,
      resolve: async (parent, args, context) => {
        const chain = context.blockchain.chain;
        return chain[chain.length - 1];
      }
    },

    blocks: {
      type: new GraphQLList(BlockType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 10 },
        offset: { type: GraphQLInt, defaultValue: 0 }
      },
      resolve: async (parent, args, context) => {
        const chain = context.blockchain.chain;
        return chain.slice(args.offset, args.offset + args.limit);
      }
    },

    transaction: {
      type: TransactionType,
      args: { hash: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (parent, args, context) => {
        for (const block of context.blockchain.chain) {
          const tx = block.transactions?.find((t) => t.hash === args.hash);
          if (tx) return tx;
        }
        return null;
      }
    },

    address: {
      type: AddressType,
      args: { address: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (parent, args, context) => {
        const balance = context.blockchain.getBalance(args.address);
        const transactions = [];

        context.blockchain.chain.forEach((block) => {
          block.transactions?.forEach((tx) => {
            if (tx.sender === args.address || tx.receiver === args.address) {
              transactions.push(tx);
            }
          });
        });

        return {
          address: args.address,
          balance,
          transactionCount: transactions.length,
          firstSeen: transactions[0]?.timestamp,
          lastActivity: transactions[transactions.length - 1]?.timestamp
        };
      }
    },

    chainInfo: {
      type: ChainInfoType,
      resolve: async (parent, args, context) => {
        return {
          name: 'Aetheron',
          chainId: 1,
          blockHeight: context.blockchain.chain.length,
          totalTransactions: context.blockchain.chain.reduce(
            (sum, block) => sum + (block.transactions?.length || 0),
            0
          ),
          difficulty: context.blockchain.difficulty,
          hashRate: 1000000,
          networkHealth: 95.5
        };
      }
    },

    nft: {
      type: NFTType,
      args: { tokenId: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (parent, args, context) => {
        // Would query NFT contract
        return {
          tokenId: args.tokenId,
          owner: '0x123...',
          metadata: 'ipfs://...',
          mintedAt: Date.now(),
          lastTransfer: Date.now()
        };
      }
    },

    proposal: {
      type: ProposalType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (parent, args, context) => {
        // Would query DAO contract
        return context.dao.getProposal(args.id);
      }
    },

    proposals: {
      type: new GraphQLList(ProposalType),
      args: {
        status: { type: GraphQLString },
        limit: { type: GraphQLInt, defaultValue: 10 }
      },
      resolve: async (parent, args, context) => {
        return context.dao.getProposals(args.status, args.limit);
      }
    }
  }
});

// Mutations
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createTransaction: {
      type: TransactionType,
      args: {
        from: { type: new GraphQLNonNull(GraphQLString) },
        to: { type: new GraphQLNonNull(GraphQLString) },
        amount: { type: new GraphQLNonNull(GraphQLFloat) },
        privateKey: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, args, context) => {
        const { Transaction } = require('./blockchain');
        const tx = new Transaction(args.from, args.to, args.amount);
        tx.signTransaction(args.privateKey);
        context.blockchain.addTransaction(tx);
        return tx;
      }
    },

    mineBlock: {
      type: BlockType,
      args: {
        minerAddress: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, args, context) => {
        context.blockchain.createBlock(args.minerAddress);
        return context.blockchain.chain[context.blockchain.chain.length - 1];
      }
    },

    vote: {
      type: ProposalType,
      args: {
        proposalId: { type: new GraphQLNonNull(GraphQLString) },
        vote: { type: new GraphQLNonNull(GraphQLString) },
        voter: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, args, context) => {
        return context.dao.vote(args.proposalId, args.vote, args.voter);
      }
    }
  }
});

// Subscriptions
const Subscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    newBlock: {
      type: BlockType,
      description: 'Subscribe to new blocks being mined',
      subscribe: () => pubsub.asyncIterator(['NEW_BLOCK'])
    },

    newTransaction: {
      type: TransactionType,
      description: 'Subscribe to new transactions',
      args: {
        address: { type: GraphQLString, description: 'Filter by address (sender or receiver)' }
      },
      subscribe: (parent, args) => {
        return pubsub.asyncIterator(['NEW_TRANSACTION']);
      },
      resolve: (payload, args) => {
        // Filter by address if provided
        if (args.address) {
          if (payload.sender === args.address || payload.receiver === args.address) {
            return payload;
          }
          return null;
        }
        return payload;
      }
    },

    priceUpdate: {
      type: new GraphQLObjectType({
        name: 'PriceUpdate',
        fields: {
          token: { type: GraphQLString },
          price: { type: GraphQLFloat },
          change24h: { type: GraphQLFloat },
          volume24h: { type: GraphQLFloat },
          timestamp: { type: GraphQLInt }
        }
      }),
      description: 'Subscribe to token price updates',
      args: {
        token: { type: GraphQLString, description: 'Filter by specific token' }
      },
      subscribe: (parent, args) => {
        if (args.token) {
          return pubsub.asyncIterator([`PRICE_UPDATE_${args.token.toUpperCase()}`]);
        }
        return pubsub.asyncIterator(['PRICE_UPDATE']);
      }
    },

    proposalUpdate: {
      type: ProposalType,
      description: 'Subscribe to DAO proposal updates',
      args: {
        proposalId: { type: GraphQLString, description: 'Filter by specific proposal' }
      },
      subscribe: (parent, args) => {
        if (args.proposalId) {
          return pubsub.asyncIterator([`PROPOSAL_UPDATE_${args.proposalId}`]);
        }
        return pubsub.asyncIterator(['PROPOSAL_UPDATE']);
      }
    },

    balanceChanged: {
      type: new GraphQLObjectType({
        name: 'BalanceChange',
        fields: {
          address: { type: GraphQLString },
          oldBalance: { type: GraphQLFloat },
          newBalance: { type: GraphQLFloat },
          change: { type: GraphQLFloat },
          timestamp: { type: GraphQLInt }
        }
      }),
      description: 'Subscribe to balance changes for an address',
      args: {
        address: { type: new GraphQLNonNull(GraphQLString) }
      },
      subscribe: (parent, args) => {
        return pubsub.asyncIterator([`BALANCE_CHANGED_${args.address}`]);
      }
    },

    nftTransfer: {
      type: new GraphQLObjectType({
        name: 'NFTTransfer',
        fields: {
          tokenId: { type: GraphQLString },
          from: { type: GraphQLString },
          to: { type: GraphQLString },
          contractAddress: { type: GraphQLString },
          timestamp: { type: GraphQLInt }
        }
      }),
      description: 'Subscribe to NFT transfers',
      args: {
        tokenId: { type: GraphQLString },
        address: { type: GraphQLString, description: 'Filter by from or to address' }
      },
      subscribe: (parent, args) => {
        if (args.tokenId) {
          return pubsub.asyncIterator([`NFT_TRANSFER_${args.tokenId}`]);
        }
        return pubsub.asyncIterator(['NFT_TRANSFER']);
      },
      resolve: (payload, args) => {
        if (args.address) {
          if (payload.from === args.address || payload.to === args.address) {
            return payload;
          }
          return null;
        }
        return payload;
      }
    },

    networkStatus: {
      type: new GraphQLObjectType({
        name: 'NetworkStatus',
        fields: {
          hashRate: { type: GraphQLFloat },
          difficulty: { type: GraphQLInt },
          peerCount: { type: GraphQLInt },
          memPoolSize: { type: GraphQLInt },
          blockHeight: { type: GraphQLInt },
          timestamp: { type: GraphQLInt }
        }
      }),
      description: 'Subscribe to network status updates',
      subscribe: () => pubsub.asyncIterator(['NETWORK_STATUS'])
    }
  }
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
  subscription: Subscription
});

// Helper functions to publish events
const publishNewBlock = (block) => {
  pubsub.publish('NEW_BLOCK', block);
};

const publishNewTransaction = (transaction) => {
  pubsub.publish('NEW_TRANSACTION', transaction);
};

const publishPriceUpdate = (priceData) => {
  pubsub.publish('PRICE_UPDATE', priceData);
  if (priceData.token) {
    pubsub.publish(`PRICE_UPDATE_${priceData.token.toUpperCase()}`, priceData);
  }
};

const publishProposalUpdate = (proposal) => {
  pubsub.publish('PROPOSAL_UPDATE', proposal);
  pubsub.publish(`PROPOSAL_UPDATE_${proposal.id}`, proposal);
};

const publishBalanceChanged = (address, oldBalance, newBalance) => {
  const data = {
    address,
    oldBalance,
    newBalance,
    change: newBalance - oldBalance,
    timestamp: Date.now()
  };
  pubsub.publish(`BALANCE_CHANGED_${address}`, data);
};

const publishNFTTransfer = (transferData) => {
  pubsub.publish('NFT_TRANSFER', transferData);
  if (transferData.tokenId) {
    pubsub.publish(`NFT_TRANSFER_${transferData.tokenId}`, transferData);
  }
};

const publishNetworkStatus = (statusData) => {
  pubsub.publish('NETWORK_STATUS', statusData);
};

module.exports = {
  schema,
  pubsub,
  publishNewBlock,
  publishNewTransaction,
  publishPriceUpdate,
  publishProposalUpdate,
  publishBalanceChanged,
  publishNFTTransfer,
  publishNetworkStatus
};
