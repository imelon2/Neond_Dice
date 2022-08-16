// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IVault {
    // function placeBet(address player, uint amount, bool isBonus, uint nftHolderRewardsAmount, uint winnableAmount) payable external;
    function placeBet(uint winnableAmount) external;
    function settleBet(address player, uint winnableAmount, bool win) external;
    function refundBet(address player, uint amount, uint winnableAmount) external;
}