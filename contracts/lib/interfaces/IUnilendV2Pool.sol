// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

interface IUnilendV2Pool {
    function userBalanceOftokens(
        uint _nftID
    )
        external
        view
        returns (
            uint _lendBalance0,
            uint _borrowBalance0,
            uint _lendBalance1,
            uint _borrowBalance1
        );
}
