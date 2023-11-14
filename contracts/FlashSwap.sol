// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./lib/interfaces/IERC20.sol";
import "./lib/interfaces/Uniswap.sol";

interface IUniswapV2Callee {
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}

interface IUnilendV2Core {
    function liquidate(
        address _pool,
        address _for,
        int256 _amount,
        address _receiver,
        bool uPosition
    ) external returns (int256 payAmount);
}

contract FlashLiquidate is IUniswapV2Callee {
    // Uniswap V2 router
    // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    address private constant WETH = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270;
    // Uniswap V2 factory
    address private constant FACTORY =
        0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

    address constant UnilendV2Core = 0x865cB73910e77970f2Bae696Ecf5F89dFb83a5B6;

    event Log(string message, uint256 val);

    function FlashSwap(
        address _tokenBorrow,
        uint256 _amount,
        address _pool,
        address _for,
        int256 _liquidationAmount,
        address _receiver,
        bool _uPosition
    ) external {
        address pair = IUniswapV2Factory(FACTORY).getPair(_tokenBorrow, WETH);
        require(pair != address(0), "!pair");

        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 amount0Out = _tokenBorrow == token0 ? _amount : 0;
        uint256 amount1Out = _tokenBorrow == token1 ? _amount : 0;

        // need to pass some data to trigger uniswapV2Call
        bytes memory data = abi.encode(
            _tokenBorrow,
            _amount,
            _pool,
            _for,
            _liquidationAmount,
            _receiver,
            _uPosition
        );

        IUniswapV2Pair(pair).swap(amount0Out, amount1Out, address(this), data);
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
        require(msg.sender == pair, "!pair");
        require(_sender == address(this), "!sender");

        (
            address tokenBorrow,
            uint256 amount,
            address pool,
            address _for,
            int256 liquidationAmount,
            address receiver,
            bool uPosition
        ) = abi.decode(
                _data,
                (address, uint256, address, address, int256, address, bool)
            );

        // about 0.3%
        uint256 fee = ((amount * 3) / 997) + 1;
        uint256 amountToRepay = amount + fee;

        // do stuff here
        // emit Log("amount", amount);
        // emit Log("amount0", _amount0);
        // emit Log("amount1", _amount1);
        // emit Log("fee", fee);
        // emit Log("amount to repay", amountToRepay);

        IUnilendV2Core(UnilendV2Core).liquidate(
            pool,
            _for,
            liquidationAmount,
            receiver,
            uPosition
        );

        IERC20(tokenBorrow).transfer(pair, amountToRepay);
    }
}
