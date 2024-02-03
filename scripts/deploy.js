// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

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

// logger.info('check logger');

const { FlashLiquidateAddress } = require('../logger/addresses');
const MaxValue =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const USER_ADDRESS = '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601';

async function main() {
  try {
    // await getSecret();
    console.log('ENV_VAL_1', process.env.testKey1);
    console.log('ENV_VAL_2', process.env.testKey2);

    const accounts = await ethers.getSigners();
    console.log(FlashLiquidateAddress, 'contract address!');

    const FlashLiquidate = await hre.ethers.getContractAt(
      flashLiquidateAbi,
      FlashLiquidateAddress
    );

    const helperContract = await hre.ethers.getContractAt(
      helperAbi,
      '0x4F57c40D3dAA7BF2EC970Dd157B1268982158720'
    );

    const data = await graphData.fetchGraphData(137);
    const poolData = await graphData.getUniswapPools(
      '0x514910771af9ca656af840dff83e8264ecf986ca',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    );
    console.log('GRAPH_DATA', data);
    console.log('POOLDATA', poolData);

    const positions = await handleLiquidate.computeLiquidablePositions(
      data,
      helperContract
    );
    // console.log(positions,"user liquidable position");

    const userData0 = await helperContract.getPoolFullData(
      '0x2EafE683A4c65B03C9b7315881704Ace33936322',
      '0xa76f2d36071907867b8db0704e3d1362f8fee3c1',
      '0xd5b26ac46d2f43f4d82889f4c7bbc975564859e3'
    );

    const liquidatePosition = async (position) => {
      try {
        const isToken0 = position.liquidableToken == 'token0';
        const isStableCoin = position[position.liquidableToken].decimals === 6;
        console.log('isStableCoin', isStableCoin);

        console.log(
          'before liquidation',
          hre.ethers.formatEther(
            isToken0 ? userData0._borrowBalance0 : userData0._borrowBalance1
          ),
          hre.ethers.formatEther(
            isToken0 ? userData0._lendBalance1 : userData0._lendBalance0
          ),
          userData0._healthFactor0,
          userData0._healthFactor1
          // hre.ethers.formatEther(1) * 10 ** 18
        );
        console.log('POSITION_ID', position.id);
        let payload = [
          isToken0 ? position.token0.id : position.token1.id,
          3000,

          new BigNumber(
            isToken0 ? position.borrowBalance0 : position.borrowBalance1
          )
            .plus(isStableCoin ? 10 ** 2 : 10 ** 12)
            .toFixed(),
          // position.borrowBalance0,
          position.pool,
          position.owner,
          isToken0 ? position.token1.id : position.token0.id,
          isToken0
            ? `-${MaxValue}`
            : MaxValue,
        ];

        console.log('PAYLOAD: ', payload);

        // profit calculation here

        // execute if profitable

        // check pool liquidity

        console.log(
          `--------------started Liquidation for position${position.id}------------------`
        );
        const flash = await FlashLiquidate.initFlash(payload);
        // user data after liquidation
        console.log(
          `--------------completed Liquidation for position${position.id}------------------`
        );

        const userData = await helperContract.getPoolFullData(
          '0x2EafE683A4c65B03C9b7315881704Ace33936322',
          '0xa76f2d36071907867b8db0704e3d1362f8fee3c1',
          '0xd5b26ac46d2f43f4d82889f4c7bbc975564859e3'
        );
        // await flash.wait();

        console.log(
          `after liquidation of position ${position.id}`,
          hre.ethers.formatEther(
            isToken0 ? userData._borrowBalance0 : userData._borrowBalance1
          ),
          hre.ethers.formatEther(
            isToken0 ? userData._lendBalance1 : userData._lendBalance0
          ),
          userData._healthFactor0,
          userData._healthFactor1
        );
      } catch (error) {
        console.error('An error occurred in liquidatePosition:', error);
        logger.error('An error occurred in liquidatePosition:', error);
      }
    };
    // needs to select one as required
    console.time('promise stated');
    // await Promise.all(positions?.map(liquidatePosition));
    // await liquidatePosition(positions[0]);
    // if (positions[1]) await liquidatePosition(positions[1]);
    // if (positions.length > 0)
    //   await Promise.allSettled(positions?.map(liquidatePosition));
    console.timeEnd('promise stated');
  } catch (error) {
    console.error('An error occurred:', error);
    logger.error('An error occurred:', error);
    process.exitCode = 1;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

function runDelay() {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  setTimeout(runDelay, process.env.DELAY * 1000);
}

runDelay();

/// code cleanup
// secrete manager code?
