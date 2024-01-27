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

logger.info('This is an information message.');

const hre = require('hardhat');
const LIQUIDATION_THRESHOLD =
  '57896044618658097711785492504343953926634992332820282019728792003956564819967';
const USER_ADDRESS = '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601';

async function main() {
  await getSecret();
  console.log('ENV_VAL_1', process.env.testKey1);
  console.log('ENV_VAL_2', process.env.testKey2);
  const UniswapFlashSwap = await hre.ethers.deployContract(
    'UniswapFlashSwap',
    []
  );
  await UniswapFlashSwap.waitForDeployment();

  const accounts = await ethers.getSigners();
  console.log(accounts[0].address, 'my address!');

  const HelperContract = await hre.ethers.deployContract('helper', []);
  await HelperContract.waitForDeployment();

  // const FlashSwapAddress = UniswapFlashSwap.target;

  console.log(`FlashSwap deployed to ${UniswapFlashSwap.target}`);
  console.log(`Helper deployed to ${HelperContract.target}`);

  const helperContract = await hre.ethers.getContractAt(
    helperAbi,
    HelperContract.target
  );

  // user data before liquidation

  const data = await graphData.fetchGraphData(137);
  // console.log('GRAPH_DATA', data);

  const positions = await handleLiquidate.computeLiquidablePositions(
    data,
    helperContract
  );

  console.log(positions, 'positions!');

  const userData0 = await helperContract.getPoolFullData(
    '0x864058b2fa9033D84Bc0cd6B92c88a697e2ac0fe',
    '0x59f5ef33a521ac871d3040cb03c0d0f7e60076a2',
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
  );

  console.log(
    'before liquidation',
    hre.ethers.parseEther(hre.ethers.formatEther(userData0._borrowBalance0)),
    hre.ethers.formatEther(userData0._lendBalance1),
    hre.ethers.formatEther(1) * 10 ** 18
  );

  // // Create payload
  const liquidatePosition = async (position) => {
    const isToken0 = position.liquidableToken == 'token0';
    console.log('POSITION_ID', position.id);
    let payload = [
      isToken0 ? position.token0.id : position.token1.id,
      // hre.ethers.formatEther(
      //   isToken0 ? position.borrowBalance0 : position.borrowBalance1
      // ) *
      //   10 ** 18,
      10 ** 9,
      position.pool,
      position.owner,
      // hre.ethers.formatEther(
      //   isToken0 ? -position.borrowBalance0 : position.borrowBalance1
      // ) *
      //   10 ** 18 ,
      -(10 ** 6),
      // `${isToken0 ? '-' : ''}${LIQUIDATION_THRESHOLD}`,
      isToken0 ? position.token1.id : position.token0.id,
      USER_ADDRESS,
    ];

    console.log('PAYLOAD: ', payload);

    // profit calculation here

    // execute if profitable

    // check pool liquidity

    const flash = await UniswapFlashSwap.FlashSwap(payload);
    // user data after liquidation

    const userData = await HelperContract.getPoolFullData(
      '0x864058b2fa9033D84Bc0cd6B92c88a697e2ac0fe',
      '0x59f5ef33a521ac871d3040cb03c0d0f7e60076a2',
      '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
    );

    console.log(
      'after liquidation',
      hre.ethers.formatEther(userData._borrowBalance0),
      hre.ethers.formatEther(userData._lendBalance1)
    );

    await flash.wait();
  };
  // needs to select one as required
  // await liquidatePosition(positions[1]);
  // await Promise.all(positions?.map(liquidatePosition));
  await Promise.allSettled(positions?.map(liquidatePosition));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/// code cleanup
// secrete manager code?
