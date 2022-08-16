// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IGame {
    function settleBet(uint256 requestId, uint256[] memory expandedValues) external;
    // function placeBet(uint betChoiceMask,uint amount) external ;
}