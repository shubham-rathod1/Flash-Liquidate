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

const hre = require('hardhat');

async function main() {
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
  console.log(data);

  const position = await handleLiquidate.computeLiquidablePositions(
    data,
    helperContract
  );

  console.log(position, 'positions!');

  const userData0 = await helperContract.getPoolFullData(
    '0x864058b2fa9033D84Bc0cd6B92c88a697e2ac0fe',
    '0x59f5ef33a521ac871d3040cb03c0d0f7e60076a2',
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
  );

  console.log(
    'before liquidation',
    hre.ethers.parseEther(hre.ethers.formatEther(userData0._borrowBalance0)),
    hre.ethers.formatEther(userData0._lendBalance1),
    hre.ethers.formatEther(1)
  );

  // Create payload

  let payload = [
    position[0].liquidabeToken == 'token0'
      ? position[0].token0.id
      : position[0].token1.id,
      2447753103339871,
    position[0].pool,
    position[0].owner,
    position[0].liquidabeToken == 'token0'
      ? '-57896044618658097711785492504343953926634992332820282019728792003956564819967'
      : '57896044618658097711785492504343953926634992332820282019728792003956564819967',
    position[0].liquidabeToken == 'token0'
      ? position[0].token1.id
      : position[0].token0.id,
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601',
  ];

  console.log(payload, "this is paylod");

  // profit calculation here

  // execute if profitable

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

  flash.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
