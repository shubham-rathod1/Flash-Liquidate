// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.

const logger = require('../logger');
require('dotenv').config();
const hre = require('hardhat');
const fs = require('fs');

async function main() {
  try {
    console.log(
      `-------------- deploying FlashLiquidate contract ------------------`
    );

    const FlashLiquidate = await hre.ethers.deployContract('FlashLiquidate', [
      '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      '0x4ceA84C8b31f40AdC606084F2d1aaF207E504BAd',
    ]);
    await FlashLiquidate.waitForDeployment();
    console.log(`deployed FlashLiquidate at ${FlashLiquidate.target}`);
    console.log(
      `-------------- saving contract address locally ------------------`
    );
    let address = `${FlashLiquidate.target}`;
    let data = `const FlashLiquidateAddress = "${address}" \n exports.FlashLiquidateAddress = FlashLiquidateAddress;`;
    fs.writeFile(`${__dirname}/../logger/addresses.js`, data, (err) => {
      if (err) console.log(err);
      else console.log(`contract address saved at ${__dirname}/addresses.txt`);
    });
  } catch (error) {
    console.error('An error occurred:', error);
    logger.error('An error occurred:', error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
