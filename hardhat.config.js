require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
// const api = process.env.HARDHAT_ALCHEMY_API;

// console.log(api, "api key")
const mainnetUrl = "";
module.exports = {
  solidity: '0.7.6',
  // '0.7.6',
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f-kvJRK`,
        enabled: true,
      },
    },
    mainnet: {
      url: mainnetUrl,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};
