import 'dotenv/config';
import '@nomicfoundation/hardhat-toolbox';

const getAccounts = () => {
  if (process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.length === 64) {
    return [`0x${process.env.DEPLOYER_PRIVATE_KEY}`];
  }
  return [];
};

export default {
  solidity: '0.8.20',
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : undefined,
      accounts: getAccounts(),
      chainId: 11155111,
      gasPrice: 20000000000 // 20 gwei
    },
    polygonAmoy: {
      url: process.env.INFURA_PROJECT_ID ? `https://polygon-amoy.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : undefined,
      accounts: getAccounts(),
      chainId: 80002,
      gasPrice: 40000000000 // 40 gwei
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: getAccounts(),
      chainId: 84532,
      gasPrice: 1000000000 // 1 gwei
    },
    ethereum: {
      url: process.env.ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : undefined,
      accounts: getAccounts(),
      chainId: 1,
      gasPrice: 20000000000 // 20 gwei
    },
    polygon: {
      url: process.env.INFURA_PROJECT_ID ? `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : undefined,
      accounts: getAccounts(),
      chainId: 137,
      gasPrice: 40000000000 // 40 gwei
    },
    base: {
      url: 'https://mainnet.base.org',
      accounts: getAccounts(),
      chainId: 8453,
      gasPrice: 1000000000 // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygonAmoy: process.env.POLYGONSCAN_API_KEY,
      baseSepolia: process.env.BASESCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      base: process.env.BASESCAN_API_KEY
    }
  }
};
