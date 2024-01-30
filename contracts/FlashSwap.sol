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
    
import "hardhat/console.sol";

interface IUnilendV2Core {
    function liquidate(
        address _pool,
        address _for,
        int256 _amount,
        address _receiver,
        bool uPosition
    ) external returns (int256 payAmount);
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

    address private constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;

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

        console.log(decoded.payer, "payer");

        console.log(
            "loan amount",
            IERC20(decoded.borrowAddress).balanceOf(address(this))
        );

        IERC20(decoded.borrowAddress).approve(
            address(unilendCore),
            decoded.amount
        );

        console.log(
            "check allowance",
            IERC20(decoded.borrowAddress).allowance(
                0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601,
                address(unilendCore)
            )
        );

        Liquidate(
            decoded.unilendPool,
            decoded.positionOwner,
            int(decoded.amount)
        );

        console.log(
            "Liquidated Successfully",
            IERC20(decoded.liqToken).balanceOf(address(this))
        );

        swapToken(decoded.liqToken, decoded.borrowAddress);

        console.log(fee0,fee1, "fee from callback");

        uint256 amountOwed = LowGasSafeMath.add(decoded.amount, fee1);

        console.log("amountOwed", amountOwed);

        if (amountOwed > 0) {
            require(
                IERC20(decoded.borrowAddress).balanceOf(address(this)) >
                    amountOwed,
                "not enough to pay loan fee!"
            );
            pay(decoded.borrowAddress, address(this), msg.sender, amountOwed);
        }
        // pay profit to user
        address user = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        TransferHelper.safeTransfer(decoded.borrowAddress, user, IERC20(decoded.borrowAddress).balanceOf(address(this)));
    }

    struct FlashParams {
        address tokenBorrow;
        uint24 fee;
        uint256 amount;
        address unilendPool;
        address positionOwner;
        address liqToken;
    }

    struct FlashCallbackData {
        uint256 amount;
        address borrowAddress;
        address payer;
        PoolAddress.PoolKey poolKey;
        address pair;
        address unilendPool;
        address positionOwner;
        address liqToken;
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

        console.log(token0, token1, "these are token0 and token1");

        uint256 amount0Out = params.tokenBorrow == token0 ? params.amount : 0;
        uint256 amount1Out = params.tokenBorrow == token1 ? params.amount : 0;

        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: token0,
            token1: token1,
            fee: params.fee
        });

        // console.log(poolKey, "poolKey");

        IUniswapV3Pool pool = IUniswapV3Pool(
            PoolAddress.computeAddress(factory, poolKey)
        );

        // console.log(pair, "poolKey");

        console.log(
            "loan amount before",
            IERC20(params.tokenBorrow).balanceOf(address(this))
        );

        pool.flash(
            address(this),
            amount0Out,
            amount1Out,
            abi.encode(
                FlashCallbackData({
                    amount: params.amount,
                    borrowAddress: params.tokenBorrow,
                    payer: msg.sender,
                    poolKey: poolKey,
                    pair: pair,
                    unilendPool: params.unilendPool,
                    positionOwner: params.positionOwner,
                    liqToken: params.liqToken
                })
            )
        );
    }

    function Liquidate(
        address _pool,
        address _for,
        // address _pair,
        int256 _liquidationAmount
    ) private {
        // require(msg.sender == _pair, "Sender is not Pair");

        unilendCore.liquidate(
            _pool,
            _for,
            _liquidationAmount,
            address(this),
            false
        );
    }

    function swapToken(
        address tokenIn,
        address tokenOut
    ) internal returns (uint256 amountOut) {
        uint amountIn = IERC20(tokenIn).balanceOf(address(this));

        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);
        console.log(
            "check allowance for swaping",
            IERC20(tokenIn).allowance(address(this), address(swapRouter))
        );

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

        // Executes the swap.
        amountOut = swapRouter.exactInput(params);

        console.log(
            "amount after swap",
            IERC20(tokenOut).balanceOf(address(this)),
            IERC20(tokenIn).balanceOf(address(this))
        );
    }
}