var BigNumber = require('bignumber.js');
const helperAbi = require('./abis/helper.json');
const flashLiquidateAbi = require('./abis/flashLiqidate.json');
const { graphData } = require('./fetcher');
const { Constants } = require('./constants');
const { handleLiquidate } = require('./liquidationBot');
const logger = require('../logger');
const getSecret = require('../secrets');
require('dotenv').config();
const hre = require('hardhat');

const { FlashLiquidateAddress } = require('../logger/addresses');
const MaxValue =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const USER_ADDRESS = '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601';

async function main() {
  try {
    const FlashLiquidate = await hre.ethers.deployContract('FlashLiquidate', [
      '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      '0x9FAf60E7350de552355Eef4e811C7E3046b0d358',
    ]);
    await FlashLiquidate.waitForDeployment();
    console.log(`deployed FlashLiquidate at ${FlashLiquidate.target}`);

    const accounts = await ethers.getSigners();
    console.log(FlashLiquidateAddress, 'contract address!');

    // const FlashLiquidate = await hre.ethers.getContractAt(
    //   flashLiquidateAbi,
    //   FlashLiquidateAddress
    // );

    const helperContract = await hre.ethers.getContractAt(
      helperAbi,
      '0x4F57c40D3dAA7BF2EC970Dd157B1268982158720'
    );

    const data = await graphData.fetchGraphData(137);
    // const poolData = await graphData.getUniswapPools(
    //   '0x514910771af9ca656af840dff83e8264ecf986ca',
    //   '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    // );

    const positions = await handleLiquidate.computeLiquidablePositions(
      data,
      helperContract
    );

    const liquidatePosition = async (position) => {
      try {
        const isToken0 = position.liquidableToken == 'token0';
        const isStableCoin = position[position.liquidableToken].decimals === 6;

        let payload = [
          isToken0 ? position.token0.id : position.token1.id,
          3000,
          new BigNumber(
            isToken0 ? position.borrowBalance0 : position.borrowBalance1
          )
            .plus(isStableCoin ? 10 ** 2 : 10 ** 12)
            .toFixed(),
          position.pool,
          position.owner,
          isToken0 ? position.token1.id : position.token0.id,
          isToken0 ? `-${MaxValue}` : MaxValue,
        ];

        console.log(
          `--------------started Liquidation for position ${position.id}------------------`
        );
        console.log('PAYLOAD: ', payload);
        const flash = await FlashLiquidate.initFlash(payload);
        const receipt = await flash.wait();
        const txHash = receipt.hash;
        const txData = {
          positionID: position.id,
          transactionHash: txHash,
          timestamp: new Date().toLocaleString(),
          user: accounts[0],
          positionOwner: position.owner,
        };
        logger.info(JSON.stringify(txData));

        console.log(
          `--------------completed Liquidation for position ${position.id}------------------`
        );

        const userData = await helperContract.getPoolFullData(
          '0x6D922876074cCA3ef3fB16D63dc45D72D9C4F2A0',
          position.pool,
          position.owner
        );

        console.log(
          `after liquidation of position ${position.id}`,
          `borrowBalance: ${hre.ethers.formatEther(
            isToken0 ? userData._borrowBalance0 : userData._borrowBalance1
          )}`,
          `lendBalance: ${hre.ethers.formatEther(
            isToken0 ? userData._lendBalance1 : userData._lendBalance0
          )}`,
          `_healthFactor0: ${userData._healthFactor0}`,
          `_healthFactor1: ${userData._healthFactor1}`
        );
      } catch (error) {
        console.error(`An error occurred in Position ${position.id}: `, error);
        logger.error(`An error occurred in Position ${position.id}: `, error);
      }
    };

    if (positions.length > 0) {
      // await Promise.allSettled(positions?.map(liquidatePosition));
      for (let i = 0; i < positions.length; i++) {
        await liquidatePosition(positions[i]);
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
    logger.error('An error occurred:', error);
    process.exitCode = 1;
  }
}

function runDelay() {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  setTimeout(runDelay, process.env.DELAY * 1000);
}

runDelay();
