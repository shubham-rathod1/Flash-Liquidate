require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
// const api = process.env.HARDHAT_ALCHEMY_API;

// console.log(api, "api key")
const mainnetUrl =
  'https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f-kvJRK';
module.exports = {
  solidity: '0.7.6',
  // '0.7.6',
  networks: {
    hardhat: {
      forking: {
        url: mainnetUrl,
        enabled: true,
      },
    },
    mainnet: {
      url: mainnetUrl,
      accounts: process.env.testKey1 ? [process.env.testKey1] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
