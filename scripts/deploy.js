// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

var BigNumber = require('bignumber.js');
const helperAbi = require('./abis/helper.json');
const { graphData } = require('./fetcher');
const { Constants } = require('./constants');
const { handleLiquidate } = require('./liquidationBot');
const logger = require('../logger');
const getSecret = require('../secrets');

logger.info('check logger');

const hre = require('hardhat');
const LIQUIDATION_THRESHOLD =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const USER_ADDRESS = '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601';

async function main() {
  try {
    await getSecret();
    console.log('ENV_VAL_1', process.env.testKey1);
    console.log('ENV_VAL_2', process.env.testKey2);

    const FlashLiquidate = await hre.ethers.deployContract('FlashLiquidate', [
      '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      '0xE1CA60c8A97b0cC0F444f5e15940E91a1d3feedF',
    ]);
    await FlashLiquidate.waitForDeployment();

    const accounts = await ethers.getSigners();
    console.log(accounts[0].address, 'my address!');

    const HelperContract = await hre.ethers.deployContract('helper', []);
    await HelperContract.waitForDeployment();

    console.log(`FlashSwap deployed to ${FlashLiquidate.target}`);
    console.log(`Helper deployed to ${HelperContract.target}`);

    const helperContract = await hre.ethers.getContractAt(
      helperAbi,
      HelperContract.target
    );

    const data = await graphData.fetchGraphData(137);

    const positions = await handleLiquidate.computeLiquidablePositions(
      data,
      helperContract
    );

    // console.log(positions,"user liquidable position");

    // const userData0 = await helperContract.getPoolFullData(
    //   '0x014f8d8F4A5B37B8b6217232cffd5d376Ec82209',
    //   '0xcb7359DcdF523F32A8987C116a001a59dcEbe00f',
    //   '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
    // );

    // console.log(
    //   'before liquidation',
    //   hre.ethers.parseEther(hre.ethers.formatEther(userData0._borrowBalance0)),
    //   hre.ethers.formatEther(userData0._lendBalance1),
    //   hre.ethers.formatEther(1) * 10 ** 18
    // );
    const liquidatePosition = async (position) => {
      try {
        const isToken0 = position.liquidableToken == 'token0';
        console.log('POSITION_ID', position.id);
        let payload = [
          isToken0 ? position.token0.id : position.token1.id,
          3000,

          // hre.ethers.formatEther(
          //   isToken0 ? position.borrowBalance0 : position.borrowBalance1
          // ) *
          //   10 ** 18,
          10000000,
          position.pool,
          position.owner,
          // hre.ethers.formatEther(
          //   isToken0 ? -position.borrowBalance0 : position.borrowBalance1
          // ) *
          //   10 ** 18 ,
          // -(10 ** 6),
          // `${isToken0 ? '-' : ''}${LIQUIDATION_THRESHOLD}`,
          isToken0 ? position.token1.id : position.token0.id,
          // USER_ADDRESS,
        ];
        // let payload = [
        //   '0x172370d5cd63279efa6d502dab29171933a610af',
        //   3000,
        //   30000000,
        //   '0xcb7359DcdF523F32A8987C116a001a59dcEbe00f',
        //   '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601',
        //   '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
        // ];

        console.log('PAYLOAD: ', payload);

        // profit calculation here

        // execute if profitable

        // check pool liquidity

        const flash = await FlashLiquidate.initFlash(payload);
        // user data after liquidation

        // const userData = await HelperContract.getPoolFullData(
        //   '0x014f8d8F4A5B37B8b6217232cffd5d376Ec82209',
        //   '0xcb7359DcdF523F32A8987C116a001a59dcEbe00f',
        //   '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
        // );

        // console.log(
        //   'after liquidation',
        //   hre.ethers.formatEther(userData._borrowBalance0),
        //   hre.ethers.formatEther(userData._lendBalance1)
        // );

        await flash.wait();
      } catch (error) {
        console.error('An error occurred in liquidatePosition:', error);
        logger.error('An error occurred in liquidatePosition:', error);
      }
    };
    // needs to select one as required
    // await liquidatePosition(positions[0]);
    // await Promise.all(positions?.map(liquidatePosition));
    await Promise.allSettled(positions?.map(liquidatePosition));
  } catch (error) {
    console.error('An error occurred:', error);
    logger.error('An error occurred:', error);
    process.exitCode = 1;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// code cleanup
// secrete manager code?
