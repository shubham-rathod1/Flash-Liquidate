const { graphData } = require("./fetcher");
const fs = require("fs");

const liquidate = async (
  borrowAddress,
  loanAmount,
  pool,
  _for,
  liquidationAmount,
  liqAddress,
  chain
) => {
  try {
    console.log("LIQUIDATE_DATA", {
      borrowAddress,
      loanAmount,
      pool,
      _for,
      liquidationAmount,
      liqAddress,
      chain,
      chainData,
    });

    console.log(chainData[chain].flashLiquidate, "chaind data");
    const config = await prepareWriteContract({
      address: chainData[chain].flashLiquidate,
      abi: coreAbi,
      functionName: "FlashSwap",
      args: [[borrowAddress, 100000, pool, _for, 100000, liqAddress]],
    });

    console.log(config, "wagmi config");
    const { hash } = await writeContract(config);
    return hash;
  } catch (error) {
    console.log(error, "from prepare write contract");
    throw error;
  }
};

async function UniswapPoolConfig(
  borrowTokenAddress,
  rewardTokenAddress,
  borrowAmount,
  rewardAmount
) {
  try {
    const borrowPools = await graphData.getUniswapPools2(
      borrowTokenAddress,
      borrowAmount
    );
    console.log("BORROW_POOLS", borrowPools.pools);

    // Fetch reward Pools
    const rewardPools = await graphData.getUniswapPools(
      rewardTokenAddress,
      rewardAmount
    );

    console.log("REWARD_POOLS", rewardPools.pools);

    // Map reward pools to objects with WETH liquidity
    const poolsWithWethLiquidity = rewardPools.pools.map((pool) => ({
      id: pool.id,
      feeTier: pool.feeTier,
      wethLiquidity: parseFloat(
        pool.token0.id === weth
          ? pool.totalValueLockedToken0
          : pool.totalValueLockedToken1
      ),
    }));

    // Find pool with the largest WETH liquidity
    const poolWithLargestWethLiquidity = poolsWithWethLiquidity.reduce(
      (maxPool, currentPool) =>
        currentPool.wethLiquidity > maxPool.wethLiquidity
          ? currentPool
          : maxPool
    );

    return [
      borrowPools.pools[0],
      poolWithLargestWethLiquidity,
      rewardPools.pools[0],
    ];
  } catch (error) {
    console.log("UniswapPoolConfig: ", error);
  }
}

// async function UniswapPoolConfig(
//   borrowTokenAddress,
//   rewardTokenAddress,
//   weth,
//   borrowAmount
// ) {
//   // console.log({borrowTokenAddress, rewardTokenAddress, weth});
//   // const _borrowTokens
//   // Fetch borrow pools
//   try {
//     console.log("GET_CHECK", weth);
//     const borrowPools = await graphData.getUniswapPools(
//       // weth, [usdt, link,sushi,weth]
//       // "0xdac17f958d2ee523a2206206994597c13d831ec7",
//       weth,
//       borrowTokenAddress
//     );

//     // check if borrowpools are non empty

//     console.log("BORROW_POOLS", borrowPools.pools);

//     const borrowedToken =
//       borrowPools?.pools[0]?.token0.id == borrowTokenAddress
//         ? "token0"
//         : "token1";

//     console.log("BORROW_TOKEN", borrowedToken);
//     // return
//     // Filter Possible Borrow Pools
//     const possibleBorrowPools = borrowPools.pools.filter((pool) => {
//       return borrowedToken == "token0"
//         ? parseFloat(pool.totalValueLockedToken0) > borrowAmount
//         : parseFloat(pool.totalValueLockedToken1) > borrowAmount;
//     });

//     console.log("POSSIBLE_BORROW_POOLS", possibleBorrowPools);

//     // if (possibleBorrowPools.length < 2)
//     //   throw new Error('No Possible Borrow Pools Found');

//     // Fetch reward Pools
//     const rewardPools = await graphData.getUniswapPools(
//       weth,
//       rewardTokenAddress
//     );
//     // if (rewardPools.length < 1)
//     //   throw new Error('No Possible reward Pools Found');

//     console.log("REWARD_POOLS", rewardPools.pools);

//     // Map reward pools to objects with WETH liquidity
//     const poolsWithWethLiquidity = rewardPools.pools.map((pool) => ({
//       id: pool.id,
//       feeTier: pool.feeTier,
//       wethLiquidity: parseFloat(
//         pool.token0.id === weth
//           ? pool.totalValueLockedToken0
//           : pool.totalValueLockedToken1
//       ),
//     }));

//     // Find pool with the largest WETH liquidity
//     const poolWithLargestWethLiquidity = poolsWithWethLiquidity.reduce(
//       (maxPool, currentPool) =>
//         currentPool.wethLiquidity > maxPool.wethLiquidity
//           ? currentPool
//           : maxPool
//     );

//     return [
//       possibleBorrowPools[0],
//       poolWithLargestWethLiquidity,
//       possibleBorrowPools[1],
//     ];
//   } catch (error) {
//     console.log(error);
//   }
// }

exports.helper = { liquidate, UniswapPoolConfig };
