const coreAddress = "0x17dad892347803551CeEE2D377d010034df64347";
const positionContract = "0x77B6569F0dbC4F265a575a84540c2A0Cae116a90";
const flashLiquidate = "0x2903D1B6341F162773d77E362FbcB825464EA7B4";
const HelperAddress = "0x4F57c40D3dAA7BF2EC970Dd157B1268982158720";
const maxAllow =
  "57896044618658097711785492504343953926634992332820282019728792003956564819967";
const graphZkEvm =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-zkevm";
const graphPolygonMain =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-polygon";
const graphMumbai =
  "https://api.thegraph.com/subgraphs/name/shubham-rathod1/my_unilend";

const chainData = {
  // 1: {
  //   id: 1,
  //   graphUrl:
  //     "https://api.thegraph.com/subgraphs/name/shubham-rathod1/mainnet-1",
  //   coreAddress: "0x7f2E24D2394f2bdabb464B888cb02EbA6d15B958",
  //   helperAddress: "0xAE84B51a1ee35275542Dd99df0F107d4F4e32A63",
  //   positionContract: "0xc45e4aE09c772D143677280f0a764f34F497677a",
  //   wETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  //   rpc: "https://eth-mainnet.g.alchemy.com/v2/W-usSWrH7oB4wQBYiPadWiplGiKz1JP_",
  // },
  1: {
    id: 1,
    graphUrl:
      "https://api.thegraph.com/subgraphs/name/shubham-rathod1/unilend-mainnet",
    coreAddress: "0xfcC475f6c889F8dB4B78E8fB8A55a98a6f996f83",
    helperAddress: "0xAE84B51a1ee35275542Dd99df0F107d4F4e32A63",
    positionContract: "0xEaC34370EE142F9F11F8211bA1c5a4c838ceBCE3",
    wETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    rpc: "https://eth-mainnet.g.alchemy.com/v2/W-usSWrH7oB4wQBYiPadWiplGiKz1JP_",
  },
  137: {
    id: 137,
    graphUrl: graphPolygonMain,
    coreAddress: coreAddress,
    helperAddress: HelperAddress,
    positionContract: positionContract,
    flashLiquidate: flashLiquidate,
    wETH: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
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
