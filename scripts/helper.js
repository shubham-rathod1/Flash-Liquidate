const {graphData} = require('./fetcher');
const fs = require('fs');

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
    console.log('LIQUIDATE_DATA', {
      borrowAddress,
      loanAmount,
      pool,
      _for,
      liquidationAmount,
      liqAddress,
      chain,
      chainData,
    });

    console.log(chainData[chain].flashLiquidate, 'chaind data');
    const config = await prepareWriteContract({
      address: chainData[chain].flashLiquidate,
      abi: coreAbi,
      functionName: 'FlashSwap',
      args: [[borrowAddress, 100000, pool, _for, 100000, liqAddress]],
    });

    console.log(config, 'wagmi config');
    const { hash } = await writeContract(config);
    return hash;
  } catch (error) {
    console.log(error, 'from prepare write contract');
    throw error;
  }
};

try {
  const existingData = fs.readFileSync('/path/to/transactions.json', 'utf-8');
  // Process existing data...
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found');
  } else {
    console.error('An error occurred:', error);
  }
}

const saveTransaction = async (transactionData) => {
  try {
    let transactionsPath = `${__dirname}/../logger/transactions.json`;
    const existingData = fs.readFileSync(transactionsPath, 'utf-8');
    console.log('EX_DATA', existingData[0]);
    const jsonData = JSON.parse(existingData) || [];
    jsonData.push(...transactionData);
    fs.writeFile(transactionsPath, JSON.stringify(jsonData), 'utf8', (err) => {
      if (err) {
        console.error('An error occurred while writing to the file:', err);
      } else {
        console.log(
          'Transaction hash has been written to the file successfully.'
        );
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('File not found');
    } else {
      console.error('An error occurred:', error);
    }
  }
};

async function UniswapPoolConfig(borrowTokenAddress, rewardTokenAddress, weth) {
  // Fetch borrow pools
  const borrowPools = await graphData.getUniswapPools(weth, borrowTokenAddress);
  const borrowedToken =
    borrowPools.pools[0].token0.id == borrowTokenAddress ? 'token0' : 'token1';

  // Filter Possible Borrow Pools
  const possibleBorrowPools = borrowPools.pools.filter((pool) => {
    return borrowedToken == 'token0'
      ? parseFloat(pool.totalValueLockedToken0) > 500
      : parseFloat(pool.totalValueLockedToken1) > 500;
  });

  // Fetch reward Pools
  const rewardPools = await graphData.getUniswapPools(weth, rewardTokenAddress);

  console.log(rewardPools.pools, "rewardpools")

  // Map reward pools to objects with WETH liquidity
  const poolsWithWethLiquidity = rewardPools.pools.map((pool) => ({
    id: pool.id,
    wethLiquidity: parseFloat(
      pool.token0.id === weth
        ? pool.totalValueLockedToken0
        : pool.totalValueLockedToken1
    ),
  }));

  // Find pool with the largest WETH liquidity
  const poolWithLargestWethLiquidity = poolsWithWethLiquidity.reduce(
    (maxPool, currentPool) =>
      currentPool.wethLiquidity > maxPool.wethLiquidity ? currentPool : maxPool
  );

  return [
    possibleBorrowPools[0],
    poolWithLargestWethLiquidity,
    possibleBorrowPools[1],
  ];
}

// exports.helper = { helperData, liquidate, saveTransaction };
exports.helper = { liquidate, saveTransaction, UniswapPoolConfig};
