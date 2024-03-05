var { BigNumber, times } = require("bignumber.js");
const helperAbi = require("./abis/helper.json");
const flashLiquidateAbi = require("./abis/flashLiqidate.json");
const { graphData } = require("./fetcher");
const { Constants } = require("./constants");
const { handleLiquidate } = require("./liquidationBot");
const logger = require("../logger");
const hre = require("hardhat");
require("dotenv").config();
const { FlashLiquidateAddress } = require("../logger/addresses");
const { helper } = require("./helper");

const MaxValue =
  "57896044618658097711785492504343953926634992332820282019728792003956564819967";
const USER_ADDRESS = "0x99A221a87b3C2238C90650fa9BE0F11e4c499D06";
// chainId = 1;
chainId = 42161;

async function liquidatePosition(
  position = {},
  FlashLiquidate,
  accounts,
  helperContract
) {
  try {
    const isToken0 = position.liquidableToken == "token0";
    const isStableCoin = position[position.liquidableToken].decimals === 6;

    let payload = [
      isToken0 ? position.token0.id : position.token1.id,
      position.pool,
      position.owner,
      isToken0 ? position.token1.id : position.token0.id,
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      isToken0 ? `-${MaxValue}` : MaxValue,
      new BigNumber(
        isToken0 ? position.borrowBalance0 : position.borrowBalance1
      )
        .plus(isStableCoin ? 10 ** 2 : 10 ** 12)
        .toFixed(),
      3000,
      3000,
      10000,
    ];

    //"5342850216387159048"
    //89532446155779568941
    // let payload = [
    //   "0x11cdb42b0eb46d95f990bedd4695a6e3fa034978",
    //   "0x8fad469416968965bc841d47886409f773c35a25",
    //   "0x99a221a87b3c2238c90650fa9be0f11e4c499d06",
    //   "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    //   "0xD5b26AC46d2F43F4d82889f4C7BBc975564859e3",
    //   "-57896044618658097711785492504343953926634992332820282019728792003956564819967",
    //   "5342851216387159048",
    //   10000,
    //   3000,
    //   10000,
    // ];

    console.log(
      `--------------started Liquidation for position ${position.id}------------------`
    );
    console.log("PAYLOAD: ", payload);
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
      new BigNumber(receipt.gasUsed).times(37).toFixed(),
      "Gas used for liquidation"
    );
    console.log(
      `--------------completed Liquidation for position ${position.id}------------------`
    );

    const userData = await helperContract.getPoolFullData(
      Constants.chainData[chainId].positionContract,
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
}

async function main() {
  try {
    const FlashLiquidate = await hre.ethers.deployContract("FlashLiquidate", [
      "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      Constants.chainData[chainId].wETH,
      Constants.chainData[chainId].coreAddress,
    ]);

    await FlashLiquidate.waitForDeployment();
    console.log(`deployed FlashLiquidate at ${FlashLiquidate.target}`);

    const accounts = await ethers.getSigners();
    // const FlashLiquidate = await hre.ethers.getContractAt(
    //   flashLiquidateAbi,
    //   FlashLiquidateAddress
    // );

    const helperContract = await hre.ethers.getContractAt(
      helperAbi,
      Constants.chainData[chainId].helperAddress
    );

    const data = await graphData.fetchGraphData(chainId);
    console.log("G_DATA", data);

    // const { pools } = await graphData.getUniswapPools(
    //   '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    //   '0xd533a949740bb3306d119cc777fa900ba034cd52',
    // );
    //   let borrowedToken = pools[0].token0.id == '0x514910771af9ca656af840dff83e8264ecf986ca'? "token0": "token1";
    // const possiblePools = pools.filter((item) => {
    //   // const token =
    //   return borrowedToken == "token0"? item.totalValueLockedToken0 > 500 : item.totalValueLockedToken1 > 500;
    //   // console.log(possiblePools, "logs");
    // });

    // console.log(
    //   await helper.UniswapPoolConfig(
    //     "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    //     "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    //     "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    //   ),
    //   "uniswap pools"
    // );

    // console.log(pools,possiblePools, 'uniswap pool');

    const positions = await handleLiquidate.computeLiquidablePositions(
      data,
      helperContract
    );
    console.log("POSITION", positions);
    if (positions.length > 0) {
      // await Promise.allSettled(
      //   positions.map((position) =>
      //     liquidatePosition(position, FlashLiquidate, accounts, helperContract)
      //   )
      // );
      for (let i = 0; i < positions.length; i++) {
        await liquidatePosition(
          positions[i],
          FlashLiquidate,
          accounts,
          helperContract
        );
      }
    }
    // await liquidatePosition({}, FlashLiquidate, accounts, helperContract);
  } catch (error) {
    console.error("An error occurred:", error);
    logger.error("An error occurred:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// function runDelay() {
//   main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
//   });
//   setTimeout(runDelay, process.env.DELAY * 1000);
// }

// runDelay();
