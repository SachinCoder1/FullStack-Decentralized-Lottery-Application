// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;

// Imports
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

// Custom errors
error Lottery__NotOwner();
error Lottery__NotEnoughEthEntered();
error Lottery__TransferToWinnerFailed();

// Contract
contract DecentralizedLottery is VRFConsumerBaseV2 {
    // State Variables
    uint256 private immutable entranceFee; // Fee to get one lottery ticket.

    address public owner; // Owner of the contract
    address private recentWinner; // The most recent winner

    address payable[] private allPlayers;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    // Variables for chainlink random number function;
    bytes32 private immutable gasLane;
    uint64 private immutable subscriptionId;
    uint32 private immutable callbackGasLimit;
    uint32 private constant NO_OF_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    // Events
    event lotteryEnter(address indexed player);
    event randomNumberPick(uint256 indexed requestId);
    event winnerPicked(address indexed recentWinner);

    //    Constructor
    constructor(
        address vrfCoordinatorV2,
        uint256 _entranceFee,
        bytes32 _gasLane,
        uint64 _subscriptionId,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        entranceFee = _entranceFee;
        owner = msg.sender;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        gasLane = _gasLane;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
    }

    // Modifiers
    modifier notOwner() {
        if (owner != msg.sender) {
            revert Lottery__NotOwner();
        }
        _;
    }

    // The entered value is less then the entrance fee.
    modifier notEnoughEthEntered() {
        if (msg.value < entranceFee) {
            revert Lottery__NotEnoughEthEntered();
        }
        _;
    }

    // View Functions

    // get entrance fee.
    function getEntranceFee() public view returns (uint256) {
        return entranceFee;
    }

    // Get player
    function getPlayer(uint256 index) public view returns (address) {
        return allPlayers[index];
    }

    // Get Recent Winner
    function getRecentWinner() public view returns (address) {
        return recentWinner;
    }

    // Functions

    // Enter the lottery ticket.
    function enterLottery() public payable notEnoughEthEntered {
        allPlayers.push(payable(msg.sender));

        //   Emitting events
        emit lotteryEnter(msg.sender);
    }

    // Pick a random number;
    function pickRandomNumber() external {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            gasLane,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            callbackGasLimit,
            NO_OF_WORDS
        );

        // Emitting event
        emit randomNumberPick(requestId);
    }

    function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords)
        internal
        override
    {
        uint256 index = randomWords[0] % allPlayers.length;
        address payable _recentWinner = allPlayers[index];
        recentWinner = _recentWinner;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if(!success) {revert Lottery__TransferToWinnerFailed();}
        emit winnerPicked(recentWinner);

    }
}
