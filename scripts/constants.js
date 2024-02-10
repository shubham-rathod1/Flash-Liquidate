const coreAddress = '0x26883aD38ef58f4E33ce533f64E16c61319c99f6';
const positionContract = '0x4B915E92a80498ca5e13c2f2715706A56C05659c';
const flashLiquidate = '0x2903D1B6341F162773d77E362FbcB825464EA7B4';
const HelperAddress = '0x4F57c40D3dAA7BF2EC970Dd157B1268982158720';
const maxAllow =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const graphZkEvm =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-zkevm';
const graphPolygonMain =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-polygon-2';
const graphMumbai =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/my_unilend';

const chainData = {
  1: {
    id: 1,
    graphUrl:
      'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-mainnet',
    coreAddress: '0xFf5a76B24e6A3F01E8FcA19661CFD2B69A88BE59',
    helperAddress: '0xAE84B51a1ee35275542Dd99df0F107d4F4e32A63',
    positionContract: '0xeE607AFC0A1b5cf67B5AAe1Be3E7A154E2B162c7',
    rpc: 'https://eth-mainnet.g.alchemy.com/v2/VZuKJ8r8DNkp7-YEc8NNg51BQnuwdhXK',
  },
  137: {
    id: 137,
    graphUrl: graphPolygonMain,
    coreAddress: coreAddress,
    helperAddress: HelperAddress,
    positionContract: positionContract,
    flashLiquidate: flashLiquidate,
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/lGRIjTUZouUNPNZoyjSAFlVL0f-kvJRK`,
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
