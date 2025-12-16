require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      accounts: ["0xYOUR_PRIVATE_KEY"]
    },
    mumbai: {
      url: "https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["0xYOUR_PRIVATE_KEY"]
    }
  }
};