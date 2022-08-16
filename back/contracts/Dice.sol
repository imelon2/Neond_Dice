// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";


import "./interface/IVRFCenter.sol";
import "./interface/IGame.sol";
import "./interface/IVault.sol";

contract Dice is Ownable, ReentrancyGuard, IGame{
    using SafeERC20 for IERC20; // ??
    using SafeERC20 for IERC20Permit; // ??

    IERC20 NeonToken;
    IERC20Permit NeonTokenP;
    IVRFCenter VRFCenter;
    IVault Vault;

    constructor(address _tokenAddress,address _vaultAddress,address _VRFAddress) {
        NeonToken = IERC20(_tokenAddress);
        NeonTokenP = IERC20Permit(_tokenAddress);
        tokenAddress = _tokenAddress;
        Vault = IVault(_vaultAddress);
        vaultAddress =_vaultAddress;
        VRFCenter = IVRFCenter(_VRFAddress);
        VRFCenterAddress = _VRFAddress;
    }

    // Variables
    bool public gameIsLive = true;
    uint public minBetAmount = 1 ether;
    uint public maxBetAmount = 500 ether;

    // Each bet is deducted 2.2% in favor of the house
    uint public HOUSE_EDGE_PERCENT = 220;

    address public VRFCenterAddress;
    address public vaultAddress;
    address public tokenAddress;

    // Modulo is the number of equiprobable outcomes in a game:
    //  6 for dice roll
    uint constant MODULO = 6;

    // These are constants taht make O(1) population count in placeBet possible.
    uint constant POPCNT_MULT = 0x0000000000002000000000100000000008000000000400000000020000000001;
    uint constant POPCNT_MASK = 0x0001041041041041041041041041041041041041041041041041041041041041;
    uint constant POPCNT_MODULO = 0x3F;


    struct Bet {
        uint8 rollUnder;
        uint40 choice;
        uint40 outcome;
        uint168 placeBlockNumber;
        uint128 amount;
        uint128 winAmount;
        address player;
        bool isSettled;
    }

    Bet[] public bets;
    mapping(uint256 => uint[]) public betMap;
    
    // modifier
    modifier isVRFCenter {
        require(VRFCenterAddress == msg.sender, "You are not allowed");
        _;
    }

    // Events
    event BetPlaced(uint indexed betId, address indexed player, uint amount, uint indexed rollUnder, uint choice);

    event BetSettled(uint indexed betId, address indexed player, uint amount, uint indexed rollUnder, uint choice, uint outcome, uint winAmount);

    event BetRefunded(uint indexed betId, address indexed player, uint amount);


    // Methods
    function initializeVRFCenter(address _address) external onlyOwner {
        require(gameIsLive == false, "Bets in pending");
        VRFCenter = IVRFCenter(_address);
        VRFCenterAddress = _address;
    }

    // setter
    // stop/start Game
    function toggleGameIsLive() external onlyOwner {
        gameIsLive = !gameIsLive;
    }
    // set minBetAmount
    function setMinBetAmount(uint _minBetAmount) external onlyOwner {
        require(_minBetAmount < maxBetAmount, "Min amount must be less than max amount");
        minBetAmount = _minBetAmount;
    }
    // set maxBetAmount
    function setMaxBetAmount(uint _maxBetAmount) external onlyOwner {
        require(_maxBetAmount > minBetAmount, "Max amount must be greater than min amount");
        maxBetAmount = _maxBetAmount;
    }
    // set HOUSE_EDGE_PERCENT
    function setHouseEdgePercent(uint _HOUSE_EDGE_PERCENT) external onlyOwner {
        require(gameIsLive == false, "Bets in pending");
        HOUSE_EDGE_PERCENT = _HOUSE_EDGE_PERCENT;
    }

    // Converters
    // House Edge Calculated Price
    function getAmountAfterEdge(uint amount) internal view returns(uint) {
        return amount * (10000 - HOUSE_EDGE_PERCENT) / 10000;
    }

    // getter
    // Amount a player can earn if he wins
    function getWinAmount(uint _amount, uint rollUnder) internal view returns (uint) {
        require(0 < rollUnder && rollUnder <= MODULO, "Win probability out of range");
        uint bettableAmount = getAmountAfterEdge(_amount);
        return bettableAmount * MODULO / rollUnder;
    }

    // get Player`s Neon Token
    function getBalanceOf(address _address) internal view returns(uint) {
        return NeonToken.balanceOf(_address);
    }

    
    // :) EIP-712 sign permit for transfer Token
    function placeBet(uint betChoiceMask,uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external nonReentrant {
        require(gameIsLive, "Game is not live");
        require(getBalanceOf(msg.sender) >= amount,"player not enough Balance");
        require(betChoiceMask > 0 && betChoiceMask < 2 ** MODULO - 1, "Bet mask not in range");
        require (amount >= minBetAmount && amount <= maxBetAmount, "Bet amount should be within range.");

        // approve send player`s token
        NeonTokenP.safePermit(msg.sender, address(this), amount, deadline, v, r, s);
        
        uint rollUnder = ((betChoiceMask * POPCNT_MULT) & POPCNT_MASK) % POPCNT_MODULO;

        uint betId = bets.length;
        uint winnableAmount = getWinAmount(amount, rollUnder);

        // transfor player`s token to VAULT
        NeonToken.safeTransferFrom(msg.sender, vaultAddress, amount);
        // Lock Player`s winnings in the VAULT.
        Vault.placeBet(winnableAmount);
        
        //request random number
        betMap[VRFCenter.sendRequestRandomness()].push(betId);

        emit BetPlaced(betId, msg.sender, amount, rollUnder, betChoiceMask);  
        bets.push(Bet({
            rollUnder: uint8(rollUnder),
            choice: uint40(betChoiceMask),
            outcome: 0,
            placeBlockNumber: uint168(block.number),
            amount: uint128(amount),
            winAmount: 0,
            player: msg.sender,
            isSettled: false
        }));
    }

    function settleBet(uint256 requestId, uint256[] memory expandedValues) external isVRFCenter {
        uint[] memory pendingBetIds = betMap[requestId];
        uint i;
        for (i = 0; i < pendingBetIds.length; i++) {
            // The VRFManager is optimized to prevent this from happening, this check is just to make sure that if it happens the tx will not be reverted, if this result is true the bet will be refunded manually later
            if (gasleft() <= 80000) {
                return;
            }
            // The pendingbets are always <= than the expandedValues
            _settleBet(pendingBetIds[i], expandedValues[i]);
        }
    }

    function _settleBet(uint betId, uint256 randomNumber) private nonReentrant {
        Bet storage bet = bets[betId];

        uint amount = bet.amount;
        if (amount == 0 || bet.isSettled == true) {
            return;
        }

        address player = bet.player;
        uint choice = bet.choice;
        uint rollUnder = bet.rollUnder;

        // VRF final result
        uint outcome = (randomNumber % MODULO);

        // +1 => The random number starts from 0. Dice's selection count starts at 1, so 1 is added.
        // uint outcome = _outcome + 1;

        uint winnableAmount = getWinAmount(amount, rollUnder);
        uint winAmount = (2 ** outcome) & choice != 0 ? winnableAmount : 0;

        bet.isSettled = true;
        bet.winAmount = uint128(winAmount);
        bet.outcome = uint40(outcome);

        Vault.settleBet(player, winnableAmount, winAmount > 0);
        emit BetSettled(betId, player, amount, rollUnder, choice, outcome, winAmount);
    }
}