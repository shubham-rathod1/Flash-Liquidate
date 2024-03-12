const axios = require("axios");
const { Constants } = require("./constants");

// console.log(Constants.chainData, "from constants")

const uniswapGraphUrl =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
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

const query2 = `
  query GetPool($token1: ID!, $token2: ID!, $amount: Float!) {
    pools(
      first: 10
      where: { token0_in: [$token1, $token2], token1_in: [$token1, $token2], totalValueLockedToken0_gt:$amount,  totalValueLockedToken1_gt:$amount,}
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

const query3 = `
query GetPool($token1: ID!, $amount: String!)
  {
    pools(
    first: 10
    where: {or: [{token0: $token1, totalValueLockedToken0_gt:$amount}, {token1: $token1, totalValueLockedToken1_gt:$amount}]}
    ) {
        id
        feeTier
        token0 {
          name
          id
          totalValueLocked
        }
        token1 {
          totalValueLocked
          id
          name
        }
      }
  }

`;

const fetchGraphData = async (chain) => {
  try {
    const url = Constants.chainData[chain].graphUrl;
    console.log(Constants.chainData[chain].helperAddress);
    let filteredData = [];

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// const getUniswapPools2 = (token1, amount) => {
//   return axios
//     .post(uniswapGraphUrl, {
//       query,
//       // query,
//       variables: {
//         token1,
//         token2: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//         amount,
//       },
//     })
//     .then((res) => {
//       const pools = res.data.data.pools;

//       let selectedToken;
//       for (let pool of pools) {
//         if (pool.token0.id !== "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
//           selectedToken = pool.token0;
//           break;
//         } else if (
//           pool.token1.id !== "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
//         ) {
//           selectedToken = pool.token1;
//           break;
//         }
//       }
//       return {
//         pool: pools[0] || {},
//         selectedToken,
//       };
//     });
// };

const getUniswapPools2 = (token1, amount) => {
  return axios
    .post(uniswapGraphUrl, {
      query: query3,
      variables: {
        token1,
        amount,
      },
    })
    .then((res) => {
      const pools = res.data.data.pools;
      console.log("CHECK_POOL_DATA", pools);
      return res.data.data;
    });
};

exports.graphData = { fetchGraphData, getUniswapPools, getUniswapPools2 };
