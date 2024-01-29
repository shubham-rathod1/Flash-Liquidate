// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');

async function main() {
  const FlashLiquidate = await hre.ethers.deployContract('FlashLiquidate', [
    '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    '0xE1CA60c8A97b0cC0F444f5e15940E91a1d3feedF',
  ]);
  await FlashLiquidate.waitForDeployment();
  // const FlashSwapAddress = UniswapFlashSwap.target;

  console.log(`FlashSwap deployed to ${FlashLiquidate.target}`);

  const flash = await FlashLiquidate.initFlash([
    '0x172370d5cd63279efa6d502dab29171933a610af',
    3000,
    30000000,
    '0xcb7359DcdF523F32A8987C116a001a59dcEbe00f',
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601',
    '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
  ]);

  // const swap = await FlashLiquidate.swapToken("0xcb7359DcdF523F32A8987C116a001a59dcEbe00f", "0x172370d5cd63279efa6d502dab29171933a610af")

  // const TokenSwaps = await hre.ethers.deployContract('TokenSwapper', []);
  // await TokenSwaps.waitForDeployment();
  // // const TokenSwapsAddress = TokenSwaps.target;

  // console.log(`TokenSwaps deployed to ${TokenSwaps.target}`);

  // TokenSwaps.swapTokens(
  //   '0x172370d5cd63279efa6d502dab29171933a610af',
  //   '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  //   1000000,
  //   0
  // );

  flash.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
