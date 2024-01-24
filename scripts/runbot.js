const hre = require('hardhat');
const { graphData } = require('./fetcher');
const { computeLiquidablePositions } = require('./liquidationBot');
const helperAbi = require('./abis/helper.json');

async function main() {
    const HelperContract = await hre.ethers.deployContract('helper', []);
  await HelperContract.waitForDeployment();

  const blockNumber = await ethers.provider.getBlockNumber();

  const helperContract = await hre.ethers.getContractAt(
    helperAbi,
    "0xA004df2beeF4EF4a58333B814A16c677c1DF4E64"
  );
  const data = await helperContract.getPoolFullData(
    '0x864058b2fa9033D84Bc0cd6B92c88a697e2ac0fe',
    '0x59f5ef33a521ac871d3040cb03c0d0f7e60076a2',
    '0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601'
  );
  console.log(hre.ethers.formatEther(data._lendBalance1), "contract data!");
  //   const positionData = await graphData.fetchGraphData(137);
  // const liqidablePositions = await computeLiquidablePositions(positionData,137,)
}

main().catch((err) => {
  console.log(err);
  process.exitCode = 1;
});
