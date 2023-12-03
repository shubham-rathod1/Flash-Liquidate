// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./lib/interfaces/Uniswap.sol";
import "hardhat/console.sol";

contract UniswapFlashSwap is IUniswapV2Callee {
    using SafeERC20 for IERC20;

    address private constant WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    address private constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    address private constant FACTORY =
        0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32;
    address private constant UNILEDV2_CORE =
        0xE1CA60c8A97b0cC0F444f5e15940E91a1d3feedF;
    address private constant UNISWAP_ROUTER =
        0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;

    address public user = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    IUniswapV2Router public uniswapRouter;
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
    }

    constructor() {
        uniswapRouter = IUniswapV2Router(UNISWAP_ROUTER);
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
            args.liqAddress
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
            address liqAddress
        ) = abi.decode(
                _data,
                (address, uint256, address, address, int256, address)
            );

        // about 0.3%
        uint256 fee = ((amount * 3) / 997) + 1;
        uint256 amountToRepay = amount + fee;

        IERC20(tokenBorrow).approve(UNILEDV2_CORE, amount);

        console.log(
            "user Balance befor liq",
            IERC20(tokenBorrow).balanceOf(user)
        );

        Liquidate(pool, _for, pair, liquidationAmount);
        emit Log(
            "Liquidated Successfully",
            IERC20(liqAddress).balanceOf(address(this))
        );

        swapTokens(liqAddress, tokenBorrow, pair, amount);

        emit Log(
            "After successful swap",
            IERC20(tokenBorrow).balanceOf(address(this))
        );

        // payback flashloan
        IERC20(tokenBorrow).safeTransfer(pair, amountToRepay);

        uint256 remaining_Bal = IERC20(tokenBorrow).balanceOf(address(this));

        // transfer bonus to liquidator
        IERC20(tokenBorrow).safeTransfer(user, remaining_Bal);

        emit Log("Transfered to Liquidator", remaining_Bal);
        console.log(
            "user Balance after liq",
            IERC20(tokenBorrow).balanceOf(user)
        );
    }

    function Liquidate(
        address _pool,
        address _for,
        address _pair,
        int256 _liquidationAmount
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

        // Execute the token swap
        uniswapRouter.swapExactTokensForTokens(
            IERC20(_tokenIn).balanceOf(address(this)),
            amount,
            path,
            address(this),
            block.timestamp + 300 // deadline (5 minutes from now)
        );
    }
}
