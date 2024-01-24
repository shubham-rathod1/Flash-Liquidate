const graphData = require('./fetcher');

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

exports.helper = { helperData, liquidate };
