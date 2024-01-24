const axios = require('axios');
const { Constants } = require('./constants');

// console.log(Constants.chainData, "from constants")

const uniswapGraphUrl =
  'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
// const unilendGraphUrl = chainData
const query = `
  query GetPool($token1: ID!, $token2: ID!) {
    pools(
      first: 10
      where: { token0_in: [$token1, $token2], token1_in: [$token1, $token2] }
    ) {
      id
      token0 {
        name
        id
      }
      feeTier
      token1 {
        name
        id
      }
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

const fetchGraphData = async (chain) => {
  try {
    const url = Constants.chainData[chain].graphUrl;
    console.log(Constants.chainData[chain].helperAddress);
    let filteredData = [];

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{positions(where: {or:[{borrowBalance0_gt:"0"}, {borrowBalance1_gt: "0"}]}) {
    id
    borrowBalance0
    borrowBalance1
    lendBalance0
    lendBalance1
    owner
    pool {
      id
    }
    token0 {
      id
      symbol
      name
    }
    token1 {
      id
      symbol
      name
    }
  }
}
`,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        filteredData = res.data.positions;
      });
      // console.log(filteredData);
    return filteredData;
  } catch (error) {
    console.log(error);
  }
};

const getUniswapPools = (token1, token2) => {
  return axios
    .post(uniswapGraphUrl, {
      query,
      variables: {
        token1,
        token2,
      },
    })
    .then((res) => {
      console.log(res.data.data);
      return res.data.data;
    });
};

// getUniswapPools(
//   '0x514910771af9ca656af840dff83e8264ecf986ca',
//   '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
// );

// fetchGraphData(137);

console.log("is this running")

exports.graphData = {fetchGraphData};