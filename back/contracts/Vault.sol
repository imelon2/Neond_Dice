// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interface/IVault.sol";

contract Vault is ReentrancyGuard, Ownable{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public NeonToken;

    constructor(IERC20 tokenAddress) {
        NeonToken = tokenAddress;
    }

    // Funds that are locked in potentially winning bets. Prevents contract from committing to new bets that it cannot pay out.
    uint public lockedInBets;
    
    // Balance-to-maxProfit ratio. Used to dynamically adjusts maxProfit based on balance.
    uint public balanceMaxProfitRatio = 1;

    bool public houseLive = true;

    mapping(address => bool) private addressAdmin;


    modifier admin {
        require(addressAdmin[msg.sender] == true, "You are not an admin");
        _;
    }

    modifier isHouseLive {
        require(houseLive == true, "House not live");
        _;
    }

    // Getter
    // 금고 총 액
    function balance() public view returns (uint) {
        return NeonToken.balanceOf(address(this));
    }

    // Set balance-to-maxProfit ratio. 
    function setBalanceMaxProfitRatio(uint _balanceMaxProfitRatio) external onlyOwner {
        balanceMaxProfitRatio = _balanceMaxProfitRatio;
    }

    // Methods
    function toggleHouseLive() external onlyOwner {
        houseLive = !houseLive;
    }
    // 게임 컨트렉트 접근 권한-추가
    function addAdmin(address _address) external onlyOwner {
        addressAdmin[_address] = true;
    }
    // 게임 컨트렉트 접근 권한-제거
    function removeAdmin(address _address) external onlyOwner {
        addressAdmin[_address] = false;
    }

    // Game methods
    // 인출 가능한 총 액수
    function balanceAvailableForBet() public view returns (uint) {
        // return balance() - lockedInBets - lockedInRewards;
        return balance() - lockedInBets;
    }

    // Returns maximum profit allowed per bet. Prevents contract from accepting any bets with potential profit exceeding maxProfit.
    function maxProfit() public view returns (uint) {
        return balanceAvailableForBet() / balanceMaxProfitRatio;
    }
    
    function placeBet(uint winnableAmount) external isHouseLive admin nonReentrant {
        require(winnableAmount <= maxProfit(), "MaxProfit violation");
        lockedInBets += winnableAmount;
    }


    function settleBet(address player, uint winnableAmount, bool win) external nonReentrant {
        lockedInBets = lockedInBets.sub(winnableAmount);
        if (win == true) {
            // payable(player).transfer(winnableAmount);
            NeonToken.safeTransfer(player,winnableAmount);
        }
    }
}