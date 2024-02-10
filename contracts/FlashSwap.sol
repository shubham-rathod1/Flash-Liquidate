// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/base/PeripheryPayments.sol";
import "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "@uniswap/v3-periphery/contracts/libraries/CallbackValidation.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./lib/interfaces/IUniswapV3Factory.sol";
// import "./lib/interfaces/IUnilendV2Pool.sol";
import "hardhat/console.sol";

interface IUnilendV2Core {
    function liquidate(
        address _pool,
        address _for,
        int _amount,
        address _receiver,
        bool uPosition
    ) external returns (int payAmount);
}
contract FlashLiquidate is
    IUniswapV3FlashCallback,
    PeripheryImmutableState,
    PeripheryPayments
{
    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;

    ISwapRouter public immutable swapRouter;
    IUniswapV3Factory public immutable factoryAddress;
    IUnilendV2Core public immutable unilendCore;

    constructor(
        ISwapRouter _swapRouter,
        address _factory,
        address _WETH9,
        IUnilendV2Core _unilendCore
    ) PeripheryImmutableState(_factory, _WETH9) {
        swapRouter = _swapRouter;
        unilendCore = _unilendCore;
        factoryAddress = IUniswapV3Factory(_factory);
    }

    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override {
        FlashCallbackData memory decoded = abi.decode(
            data,
            (FlashCallbackData)
        );
        CallbackValidation.verifyCallback(factory, decoded.poolKey);

        IERC20(decoded.borrowAddress).approve(
            address(unilendCore),
            type(uint).max
        );

        console.log(
            IERC20(decoded.borrowAddress).balanceOf(decoded.userWallet),
            "user balance before liquidation"
        );

        unilendCore.liquidate(decoded.unilendPool,
            decoded.positionOwner,
            decoded.liqAmount,
            address(this),
            false
            );

        console.log(
            "Liquidated Successfully",
            IERC20(decoded.liqToken).balanceOf(address(this))
        );

        _swapToken(decoded.liqToken, decoded.borrowAddress);

        _paybackAndPayProfit(decoded.borrowAddress,decoded.amount,fee0,fee1, decoded.userWallet);
    }
    struct FlashParams {
        address tokenBorrow;
        address unilendPool;
        address positionOwner;
        address liqToken;
        address userWallet;
        int256 liqAmount;
        uint256 amount;
        uint24 fee;
    }
    struct FlashCallbackData {
        address borrowAddress;
        address payer;
        address pair;
        address unilendPool;
        address positionOwner;
        address liqToken;
        address userWallet;
        uint256 amount;
        int256 liqAmount;
        PoolAddress.PoolKey poolKey;
    }

    function initFlash(FlashParams memory params) external {
        address pair = factoryAddress.getPool(
            WETH9,
            params.tokenBorrow,
            params.fee
        );

        require(pair != address(0), "Pair not found");
        console.log(pair, "pair found");

        uint256 liquidity = IUniswapV3Pool(pair).liquidity();

        require(liquidity >= params.amount, "not enough liquidity");

        address token0 = IUniswapV3Pool(pair).token0();
        address token1 = IUniswapV3Pool(pair).token1();

        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: token0,
            token1: token1,
            fee: params.fee
        });

        IUniswapV3Pool pool = IUniswapV3Pool(
            PoolAddress.computeAddress(factory, poolKey)
        );
        
        pool.flash(
            address(this),
            params.tokenBorrow == token0 ? params.amount : 0,
            params.tokenBorrow == token1 ? params.amount : 0,
            abi.encode(
                FlashCallbackData({
                    amount: params.amount,
                    borrowAddress: params.tokenBorrow,
                    payer: msg.sender,
                    poolKey: poolKey,
                    pair: pair,
                    unilendPool: params.unilendPool,
                    positionOwner: params.positionOwner,
                    userWallet: params.userWallet,
                    liqToken: params.liqToken,
                    liqAmount: params.liqAmount
                })
            )
        );
    }

    function _swapToken(
        address tokenIn,
        address tokenOut
    ) private {
        uint amountIn = IERC20(tokenIn).balanceOf(address(this));
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);
        uint24 poolFee1 = 3000;
        uint24 poolFee2 = 10000;
        ISwapRouter.ExactInputParams memory params = ISwapRouter
            .ExactInputParams({
                path: abi.encodePacked(
                    tokenIn,
                    poolFee1,
                    WETH9,
                    poolFee2,
                    tokenOut
                ),
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0
            });
        swapRouter.exactInput(params);

        console.log(
            "amount after swap",
            IERC20(tokenOut).balanceOf(address(this)),
            IERC20(tokenIn).balanceOf(address(this))
        );
    }
    function _paybackAndPayProfit(address borrowAddress, uint256 amount, uint256 fee0, uint256 fee1, address userWallet) private {
        uint256 amountOwed = amount + (fee0 > 0 ? fee0 : fee1);
        require(IERC20(borrowAddress).balanceOf(address(this)) >= amountOwed, "Insufficient funds to payback loan and profit");
        pay(borrowAddress, address(this), msg.sender, amountOwed);
        TransferHelper.safeTransfer(borrowAddress, userWallet, IERC20(borrowAddress).balanceOf(address(this)));
        console.log(
            IERC20(borrowAddress).balanceOf(userWallet),
            "user got credited with profit"
        );
    }

}
