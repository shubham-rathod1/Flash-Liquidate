const { Constants } = require('./constants');
const helperAbi = require('./abis/helper.json');
const hre = require('hardhat');

const computeLiquidablePositions = async (graphData, contract) => {
  try {
    // const helper = getContractInstance(
    //   helperAbi,
    //   Constants.chainData[chain].helperAddress,
    //   web3
    // );
    // console.log(helper, chain, 'this is helper');
    const result = await Promise.all(
      graphData.map(async (item) =>
        contract.getPoolFullData(
          Constants.chainData[137].positionContract,
          item.pool.id,
          item.owner
        )
      )
    );
    console.log(result, 'this is result');
    let newArray = [];
    for (let i = 0; i < graphData.length; i++) {
      const canLiquidate =
        result[i]._healthFactor0 < 1e18 || result[i]._healthFactor1 < 1e18
          ? true
          : false;

      if (canLiquidate) {
        const liquidableToken =
          result[i]._healthFactor0 < 1e18 ? 'token0' : 'token1';

        let payload = {
          ...graphData[i],
          pool: graphData[i].pool.id,
          lendShare0: result[i]._totalLendShare0,
          lendShare1: result[i]._totalLendShare1,
          borrowShare0: result[i]._totalBorrowShare0,
          borrowShare1: result[i]._totalBorrowShare1,
          lendBalance0: result[i]._lendBalance0,
          lendBalance1: result[i]._lendBalance1,
          borrowBalance0: result[i]._borrowBalance0,
          borrowBalance1: result[i]._borrowBalance1,
          healthFactor0: result[i]._healthFactor0,
          healthFactor1: result[i]._healthFactor1,
          isLiquidate: canLiquidate,
          liquidableToken,
        };
        newArray.push(payload);
      }
    }

    return newArray;
  } catch (error) {
    console.log(error);
  }
};

exports.handleLiquidate = { computeLiquidablePositions };
