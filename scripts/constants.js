const coreAddress = '0xFf5a76B24e6A3F01E8FcA19661CFD2B69A88BE59';
const positionContract = '0xeE607AFC0A1b5cf67B5AAe1Be3E7A154E2B162c7';
const flashLiquidate = '0x2903D1B6341F162773d77E362FbcB825464EA7B4';
const HelperAddress = '0xAE84B51a1ee35275542Dd99df0F107d4F4e32A63';
const maxAllow =
  "57896044618658097711785492504343953926634992332820282019728792003956564819967";
const graphZkEvm =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-zkevm";
const graphPolygonMain =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-polygon-2";
const graphMumbai =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/my_unilend";

const chainData = {
    1: {
      id: 1,
      graphUrl:
        'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-mainnet',
      coreAddress: '0xFf5a76B24e6A3F01E8FcA19661CFD2B69A88BE59',
      helperAddress: '0xAE84B51a1ee35275542Dd99df0F107d4F4e32A63',
      positionContract: '0xeE607AFC0A1b5cf67B5AAe1Be3E7A154E2B162c7',
      rpc: "https://eth-mainnet.g.alchemy.com/v2/VZuKJ8r8DNkp7-YEc8NNg51BQnuwdhXK"
      },
    // },
  //   80001: {
  //     id: 80001,
  //     graphUrl:
  //       'https://api.thegraph.com/subgraphs/name/shubham-rathod1/my_unilend',
  //     coreAddress: '0x35B7296a75845399b0447a4F5dBCB07b5BcC8B4D',
  //     helperAddress: '0x311bE495c75dd7061A1365d507F6D81A4164192f',
  //     positionContract: '0x62f5Be0da0302665Dc39F3386B8e3e60aDe4bf7B',
  //     rpc: `https://polygon-mumbai.g.alchemy.com/v2/${
  //       import.meta.env.VITE_ALCHEMY_MUMBAI_ID
  //     }`,
  //   },
  137: {
    id: 137,
    graphUrl: graphPolygonMain,
    coreAddress: coreAddress,
    helperAddress: HelperAddress,
    positionContract: positionContract,
    flashLiquidate: flashLiquidate,
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f
    }`,
  },
};

exports.Constants = {
  coreAddress,
  HelperAddress,
  maxAllow,
  graphMumbai,
  graphPolygonMain,
  graphZkEvm,
  chainData,
};
