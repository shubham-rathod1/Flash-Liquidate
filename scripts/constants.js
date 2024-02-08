const coreAddress = '0x9FAf60E7350de552355Eef4e811C7E3046b0d358';
const positionContract = '0x6D922876074cCA3ef3fB16D63dc45D72D9C4F2A0';
const flashLiquidate = '0x2903D1B6341F162773d77E362FbcB825464EA7B4';
// 0x2903D1B6341F162773d77E362FbcB825464EA7B4
const HelperAddress = '0x4F57c40D3dAA7BF2EC970Dd157B1268982158720';
const maxAllow =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const graphZkEvm =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-zkevm';
const graphPolygonMain =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-polygon-3';
// 'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilendtest';
// "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-polygon";
const graphMumbai =
  'https://api.thegraph.com/subgraphs/name/shubham-rathod1/my_unilend';

const chainData = {
  //   1442: {
  //     id: 1442,
  //     graphUrl:
  //       'https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-zkevm',
  //     coreAddress: '0xECF9c681c22D3CcFC53670812E863b0d05828dBC',
  //     helperAddress: '0x1aaeF1b135691491f49b1029d2BDC52de4521f10',
  //     positionContract: '0x9422A2D29d932FeDB8a7e7D2259D24a4B50eF232',
  //     rpc: `https://polygonzkevm-testnet.g.alchemy.com/v2/${
  //       import.meta.env.VITE_ALCHEMY_ID
  //     }`,
  //   },
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