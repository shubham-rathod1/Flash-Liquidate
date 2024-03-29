// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./lib/interfaces/Uniswap.sol";
import "hardhat/console.sol";

contract UniswapFlashSwap is IUniswapV2Callee {
    using SafeERC20 for IERC20;

    address private constant WETH = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    address private constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    address private constant FACTORY =
        0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32;
    address private constant UNILEDV2_CORE =
        0xA9d39A0088466cbbB66266dB6C449f2645AF11c4;
    address private constant UNISWAP_ROUTER =
        0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    // address public user = 0x4EB491B0fF2AB97B9bB1488F5A1Ce5e2Cab8d601;

    IUniswapV2Router02 public uniswapRouter;
    IUnilendV2Core public unilendCore;
    IUniswapV2Factory public uniswapFactory;

    event Log(string message, uint256 val);
    struct SwapData {
        address tokenBorrow;
        uint256 amount;
        address pool;
        address _for;
        int256 liquidationAmount;
        address liqAddress;
        address user;
    }

    constructor() {
        uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER);
        unilendCore = IUnilendV2Core(UNILEDV2_CORE);
        uniswapFactory = IUniswapV2Factory(FACTORY);
    }

    function FlashSwap(SwapData memory args) external {
        // Get Uniswap Pair
        address pair = uniswapFactory.getPair(args.tokenBorrow, USDT);
        require(pair != address(0), "Pair not Found!");

        // Get Token Addresses
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 amount0Out = args.tokenBorrow == token0 ? args.amount : 0;
        uint256 amount1Out = args.tokenBorrow == token1 ? args.amount : 0;

        // Encode data for uniswapV2Call
        bytes memory data = abi.encode(
            args.tokenBorrow,
            args.amount,
            args.pool,
            args._for,
            args.liquidationAmount,
            args.liqAddress,
            args.user
        );

        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);
        emit Log(
            "Token Borrowed",
            IERC20(args.tokenBorrow).balanceOf(address(this))
        );
    }

    // called by pair contract
    function uniswapV2Call(
        address _sender,
        uint256 _amount0,
        uint256 _amount1,
        bytes calldata _data
    ) external override {
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        address pair = IUniswapV2Factory(FACTORY).getPair(token0, token1);
        require(msg.sender == pair, "Pair is not the Sender");
        require(_sender == address(this), "!Sender");

        // decode callback data
        (
            address tokenBorrow,
            uint256 amount,
            address pool,
            address _for,
            int256 liquidationAmount,
            address liqAddress,
            address user
        ) = abi.decode(
                _data,
                (address, uint256, address, address, int256, address, address)
            );

        // about 0.3%
        uint256 fee = ((amount * 3) / 997) + 1;
        uint256 amountToRepay = amount + fee;

        // console.log(amountToRepay, "amount needed to repay!");

        IERC20(tokenBorrow).approve(UNILEDV2_CORE, 115792089237316195423570985008687907853269984665640564039457584007913129639935);

        // console.log(
        //     "borrow token and collateral token balance befor liq",
        //      IERC20(tokenBorrow).balanceOf(address(this)),IERC20(liqAddress).balanceOf(address(this))
        // );

        Liquidate(pool, _for, pair, liquidationAmount);

        //  console.log(
        //     "borrow token and collateral token balance after liq",
        //      IERC20(tokenBorrow).balanceOf(address(this)),IERC20(liqAddress).balanceOf(address(this))
        // );

        emit Log(
            "Liquidated Successfully",
            IERC20(liqAddress).balanceOf(address(this))
        );

        swapTokens(liqAddress, tokenBorrow, pair, amountToRepay);

        emit Log(
            "After successful swap",
            IERC20(tokenBorrow).balanceOf(address(this))
        );
        // console.log(
        //     "swapped successfully",
        //     IERC20(tokenBorrow).balanceOf(address(this))
        // );
        // check if it is profitable;
        require(
            amountToRepay <= IERC20(tokenBorrow).balanceOf(address(this)),
            "Transaction not Profitable / Not enought to payback loan"
        );
        // payback flashloan
        IERC20(tokenBorrow).safeTransfer(pair, amountToRepay);

        uint256 remaining_Bal = IERC20(tokenBorrow).balanceOf(address(this));

        // transfer bonus to liquidator
        IERC20(tokenBorrow).safeTransfer(user, remaining_Bal);

        emit Log("Transfered to Liquidator", remaining_Bal);
        // console.log(
        //     "user Balance after liq",
        //     IERC20(tokenBorrow).balanceOf(user)
        // );
    }

    function Liquidate(
        address _pool,
        address _for,
        address _pair,
        int _liquidationAmount
    ) private {
        require(msg.sender == _pair, "Sender is not Pair");

        unilendCore.liquidate(
            _pool,
            _for,
            _liquidationAmount,
            address(this),
            false
        );
    }

    function swapTokens(
        address _tokenIn,
        address _tokenOut,
        address _pair,
        uint amount
    ) private {
        require(msg.sender == _pair, "Sender is not Pair");

        IERC20(_tokenIn).approve(
            UNISWAP_ROUTER,
            IERC20(_tokenIn).balanceOf(address(this))
        );

        // Define the token path for the swap
        address[] memory path = new address[](3);
        path[0] = _tokenIn;
        path[1] = WETH;
        path[2] = _tokenOut;

        // console.log(IERC20(_tokenIn).balanceOf(address(this)), "input amount");

        // Execute the token swap
        uniswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            IERC20(_tokenIn).balanceOf(address(this)),
            0,
            path,
            address(this),
            block.timestamp // deadline (5 minutes from now)
        );
    }
}
