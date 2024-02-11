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
        query: `{positions(where: {or:[{borrowBalance0_gt:"1"}, {borrowBalance1_gt: "1"}]}) {
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
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
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
      return res.data.data;
    });
};

exports.graphData = { fetchGraphData, getUniswapPools };
