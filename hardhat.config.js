require('@nomicfoundation/hardhat-toolbox');

/** @type import('hardhat/config').HardhatUserConfig */
// const api = process.env.HARDHAT_ALCHEMY_API;

// console.log(api, "api key")

module.exports = {
  solidity: "0.7.6",
  // '0.7.6',
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f-kvJRK`,
      },
    },
  },
};
