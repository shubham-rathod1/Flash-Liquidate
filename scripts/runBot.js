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
chainId = 1;

/****
1. Flash loan WETH loan from USDT
2. Now repay WETH and get USDC as a reward
3. Use USDC to and get WETH
4. Pay WETH to flash loan and remaining will be profit

1st pool fee if it is low
*/

async function liquidatePosition(
  position,
  FlashLiquidate,
  accounts,
  helperContract
) {
  try {
    const isToken0 = position.liquidableToken == "token0";
    const isStableCoin = position[position.liquidableToken].decimals === 6;

    const loanAmount =
      hre.ethers.formatEther(
        isToken0 ? position.borrowBalance0 : position.borrowBalance1
      ) + (isStableCoin ? 10 ** 2 : 10 ** 12);

    const rewardAmount = hre.ethers.formatEther(
      isToken0 ? position.lendBalance1 : position.lendBalance0
    );

    console.log("LOAN_AMOUNT", loanAmount);
    console.log("REWARD_AMOUNT", rewardAmount);

    const isWEth = isToken0
      ? position.token0.symbol
      : position.token1.symbol === "WETH";

    // // //USDT, USDC;
    // const tokenList = [
    //   "0xdac17f958d2ee523a2206206994597c13d831ec7",
    //   "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    // ];
    // let selectedToken = tokenList[0];
    // let selectedPool = {};
    // if (isWEth) {
    //   for (let i = 0; i < tokenList.length; i++) {
    //     const temp = await graphData.getUniswapPools2(
    //       tokenList[0],
    //       new BigNumber(
    //         isToken0 ? position.borrowBalance0 : position.borrowBalance1
    //       )
    //         .plus(isStableCoin ? 10 ** 2 : 10 ** 12)
    //         .toFixed() / isStableCoin
    //         ? 10 ** 6
    //         : 10 ** 18
    //     );

    //     if (Object.keys(temp.pool).length > 0) {
    //       console.log("CHECK_DATA", temp);
    //       selectedToken = temp.selectedToken.id;
    //       selectedPool = temp.pool;
    //       break;
    //     }
    //   }
    // }

    const poolFees = await helper.UniswapPoolConfig(
      (isToken0 ? position.token0.id : position.token1.id).toLowerCase(),
      (isToken0 ? position.token1.id : position.token0.id).toLowerCase(),
      // isWEth ? selectedToken : Constants.chainData[chainId].wETH.toLowerCase(),
      loanAmount,
      rewardAmount
    );
    console.log("poolFees", poolFees);

    console.log(
      poolFees[0].feeTier,
      poolFees[1].feeTier,
      poolFees[2].feeTier,
      "poolfees"
    );

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
      poolFees[0].feeTier,
      // selectedPool.feeTier,
      poolFees[1].feeTier,
      poolFees[2].feeTier,
      // 3000,
      // 10000,
      // 500,
    ];

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

    // console.log("G_DATA", data);

    // console.log("UNISWAP_G_DATA", temp);
    // console.log('weth', Constants.chainData[chainId].wETH);

    const positions = await handleLiquidate.computeLiquidablePositions(
      data,
      helperContract
    );
    if (positions.length > 0) {
      // await Promise.allSettled(
      //   positions.map((position) =>
      //     liquidatePosition(position, FlashLiquidate, accounts, helperContract)
      //   )
      // );

      for (let i = 0; i < positions.length - 1; i++) {
        // positions[i].id !== 6 &&
        await liquidatePosition(
          positions[i],
          FlashLiquidate,
          accounts,
          helperContract
        );
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
    logger.error("An error occurred:", error);
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
