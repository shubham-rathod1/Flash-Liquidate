// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUnilendV2Position {
    function newPosition(address _pool, address _recipient) external returns (uint nftID);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function getNftId(address _pool, address _user) external view returns (uint nftID);
}

interface IERC20 {
    function decimals() external view returns (uint256);
    function symbol() external view returns (string memory);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IUnilendV2Pool {
    function setLTV(uint8 _number) external;
    function setLB(uint8 _number) external;
    function setRF(uint8 _number) external;
    function setInterestRateAddress(address _address) external;
    function accrueInterest() external;

    function lend(uint _nftID, int amount) external returns(uint);
    function redeem(uint _nftID, int tok_amount, address _receiver) external returns(int);
    function redeemUnderlying(uint _nftID, int amount, address _receiver) external returns(int);
    function borrow(uint _nftID, int amount, address payable _recipient) external;
    function repay(uint _nftID, int amount, address payer) external returns(int);
    function liquidate(uint _nftID, int amount, address _receiver, uint _toNftID) external returns(int);
    function liquidateMulti(uint[] calldata _nftIDs, int[] calldata amount, address _receiver, uint _toNftID) external returns(int);
    
    function processFlashLoan(address _receiver, int _amount) external;
    function init(address _token0, address _token1, address _interestRate, uint8 _ltv, uint8 _lb, uint8 _rf) external;
    
    function getLTV() external view returns (uint);
    function getLB() external view returns (uint);
    function getRF() external view returns (uint);
    function lastUpdated() external view returns (uint);
    
    function userBalanceOftoken0(uint _nftID) external view returns (uint _lendBalance0, uint _borrowBalance0);
    function userBalanceOftoken1(uint _nftID) external view returns (uint _lendBalance1, uint _borrowBalance1);
    function userBalanceOftokens(uint _nftID) external view returns (uint _lendBalance0, uint _borrowBalance0, uint _lendBalance1, uint _borrowBalance1);
    function userSharesOftoken0(uint _nftID) external view returns (uint _lendShare0, uint _borrowShare0);
    function userSharesOftoken1(uint _nftID) external view returns (uint _lendShare1, uint _borrowShare1);
    function userSharesOftokens(uint _nftID) external view returns (uint _lendShare0, uint _borrowShare0, uint _lendShare1, uint _borrowShare1);
    function userHealthFactor(uint _nftID) external view returns (uint256 _healthFactor0, uint256 _healthFactor1);

    function getAvailableLiquidity0() external view returns (uint _available);
    function getAvailableLiquidity1() external view returns (uint _available);

    function token0Data() external view returns (uint, uint, uint);
    function token1Data() external view returns (uint, uint, uint);

    function interestRateAddress() external view returns (address);
    function core() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);

    function getInterestRate(uint _totalBorrow, uint _availableBorrow) external view returns (uint);
}

contract helper {
    constructor() {}

    struct outDataFull {
        uint _token0Liquidity;
        uint _token1Liquidity;
        uint _totalLendShare0;
        uint _totalLendShare1;
        uint _totalBorrowShare0;
        uint _totalBorrowShare1;
        uint _totalBorrow0;
        uint _totalBorrow1;
        uint _interest0;
        uint _interest1;
        uint _lendShare0;
        uint _borrowShare0;
        uint _lendShare1;
        uint _borrowShare1;
        uint _lendBalance0;
        uint _borrowBalance0;
        uint _lendBalance1;
        uint _borrowBalance1;
        uint _healthFactor0;
        uint _healthFactor1;
    }
    
    function getPoolFullData(address _position, address _pool, address _user) external view returns (outDataFull memory _out) {
        IUnilendV2Pool p = IUnilendV2Pool(_pool);

        _out._token0Liquidity = p.getAvailableLiquidity0();
        _out._token1Liquidity = p.getAvailableLiquidity1();
        (_out._totalLendShare0, _out._totalBorrowShare0, _out._totalBorrow0) = p.token0Data();
        (_out._totalLendShare1, _out._totalBorrowShare1, _out._totalBorrow1) = p.token1Data();

        _out._interest0 = p.getInterestRate(_out._totalBorrow0, _out._token0Liquidity);
        _out._interest1 = p.getInterestRate(_out._totalBorrow1, _out._token1Liquidity);

        if(_user != address(0)){
            uint _nftID = IUnilendV2Position(_position).getNftId(_pool, _user);
            if(_nftID > 0){
                (_out._lendShare0, _out._borrowShare0, _out._lendShare1, _out._borrowShare1) = p.userSharesOftokens(_nftID);
                (_out._lendBalance0, _out._borrowBalance0, _out._lendBalance1, _out._borrowBalance1) = p.userBalanceOftokens(_nftID);
                (_out._healthFactor0, _out._healthFactor1) = p.userHealthFactor(_nftID);
            }
        }
    }

    struct outData {
        uint ltv;
        uint lb;
        uint rf;
        uint _token0Liquidity;
        uint _token1Liquidity;
        address _core;
        address _token0;
        address _token1;
        string _symbol0;
        string _symbol1;
        uint _decimals0;
        uint _decimals1;
    }
    
    function getPoolData(address _pool) external view returns (outData memory _out) {
        IUnilendV2Pool p = IUnilendV2Pool(_pool);

        _out.ltv = p.getLTV();
        _out.lb = p.getLB();
        _out.rf = p.getRF();
        _out._token0Liquidity = p.getAvailableLiquidity0();
        _out._token1Liquidity = p.getAvailableLiquidity1();

        _out._core = p.core();
        _out._token0 = p.token0();
        _out._token1 = p.token1();

        _out._symbol0 = IERC20(_out._token0).symbol();
        _out._symbol1 = IERC20(_out._token1).symbol();
        _out._decimals0 = IERC20(_out._token0).decimals();
        _out._decimals1 = IERC20(_out._token1).decimals();
    }

    function getPoolTokensData(address _pool, address _user) external view returns (
        uint _allowance0,
        uint _allowance1,
        uint _balance0,
        uint _balance1
    ) {
        IUnilendV2Pool p = IUnilendV2Pool(_pool);

        address _core = p.core();
        address _token0 = p.token0();
        address _token1 = p.token1();

        _allowance0 = IERC20(_token0).allowance(_user, _core);
        _allowance1 = IERC20(_token1).allowance(_user, _core);
        _balance0 = IERC20(_token0).balanceOf(_user);
        _balance1 = IERC20(_token1).balanceOf(_user);
    }
}