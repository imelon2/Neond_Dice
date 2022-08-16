// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "./interface/IVRFCenter.sol";
import "./interface/IGame.sol";

contract VRFv2Center is VRFConsumerBaseV2,IVRFCenter {
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 s_subscriptionId;

    address vrfCoordinator = 0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed; // Mumbai
    bytes32 keyHash = 0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f; // 500 gwei Key Hash
    
    // Gas limit to be used when call the function fulfillRandomWords.
    uint32 public callbackGasLimit = 2500000;
    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    // request random values
    uint32 public maxBetsPerVRF = 15;
    // This value should never change, it's equal to = ChainLinkVRF V1 blocks - 1, change it only if Chainlink Oracle will change the number of wait blocks
    uint public nextReqBlocks = 9;




    struct ChainlinkReqData {
        uint128 nBets;
        uint128 blockNumber;
    }

    mapping(uint256 => ChainlinkReqData) public chainlinkReqsData;

    IGame[] public games;
    mapping(address => bool) private addressGame;

    // uint256[] public s_randomWords;
    uint256 public s_requestId;
    address s_owner;

  constructor(uint64 subscriptionId) VRFConsumerBaseV2(vrfCoordinator) {
    COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
    s_owner = msg.sender;
    s_subscriptionId = subscriptionId;
  }

    // modifier
    modifier isGame {
        require(addressGame[msg.sender] == true, "You are not a game");
        _;
    }

    modifier onlyOwner() {
    require(msg.sender == s_owner);
    _;
  }

    
    // 게임 스마트컨트렉트 주소 추가
    function addGame(address newGame) external onlyOwner {
        games.push(IGame(newGame));
        addressGame[newGame] = true;
    }


    // 게임 스마트 컨트렉트 주소 삭제
    function removeGame(address toRemove) external onlyOwner {
        addressGame[toRemove] = false;
        for (uint i = 0; i < games.length; i++) {
            if (address(games[i]) == toRemove) {
                games[i] = games[games.length - 1];
                games.pop();
                return;
            }
        }
    }

    // setter
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }
    function setMaxBetsPerVRF(uint32 _maxBetsPerVRF) external onlyOwner {
        maxBetsPerVRF = _maxBetsPerVRF;
    }
    function setNextReqBlocks(uint _nextReqBlocks) external onlyOwner {
        nextReqBlocks = _nextReqBlocks;
    }

  // Assumes the subscription is funded sufficiently.
  function sendRequestRandomness() external isGame returns(uint256){
    // Will revert if subscription is not set and funded.
    ChainlinkReqData memory data = chainlinkReqsData[s_requestId];

    if (data.blockNumber + nextReqBlocks <= block.number || data.nBets >= maxBetsPerVRF){
        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            maxBetsPerVRF
        );

        chainlinkReqsData[s_requestId] = ChainlinkReqData({
            nBets: 1,
            blockNumber: uint128(block.number)
        });
    } else {
        chainlinkReqsData[s_requestId].nBets++;
    }

    return s_requestId;
  }


  function fulfillRandomWords(
    uint256 requestId, /* requestId */
    uint256[] memory randomWords
  ) internal override {         
    uint256[] memory expandedValues = randomWords;
    for (uint i = 0; i < games.length; i++) {
        if (gasleft() <= 150000) {
            return;
        }
        games[i].settleBet(requestId, expandedValues);
    }
  }

}
