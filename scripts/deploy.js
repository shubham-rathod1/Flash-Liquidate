// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');

async function main() {
  const UniswapFlashSwap = await hre.ethers.deployContract(
    'UniswapFlashSwap',
    []
  );
  await UniswapFlashSwap.waitForDeployment();
  // const FlashSwapAddress = UniswapFlashSwap.target;

  console.log(`FlashSwap deployed to ${UniswapFlashSwap.target}`);

  const flash = await UniswapFlashSwap.FlashSwap([
    '0x172370d5cd63279efa6d502dab29171933a610af',
    10000000000,
    '0xcb7359dcdf523f32a8987c116a001a59dcebe00f',
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601',
    10000000000,
    '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a',
  ]);

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
