require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
// const api = process.env.HARDHAT_ALCHEMY_API;

// console.log(api, "api key")
const polygonUrl =
  "https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f-kvJRK";
const mainnetUrl =
  "https://eth-mainnet.g.alchemy.com/v2/VZuKJ8r8DNkp7-YEc8NNg51BQnuwdhXK";
const arbitrumUrl = `https://arb-mainnet.g.alchemy.com/v2/${process.env.VITE_ALCHEMY_ID_ARBITRUM}`;
module.exports = {
  solidity: "0.7.6",
  // '0.7.6',
  networks: {
    hardhat: {
      forking: {
        url: arbitrumUrl,
        enabled: true,
      },
    },
    mainnet: {
      url: arbitrumUrl,
      accounts: process.env.testKey1 ? [process.env.testKey1] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
