// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

// Imports
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// Custom errors
error Lottery__NotEnoughEthEntered();
error Lottery__TransferToWinnerFailed();
error Lottery__NotOpen();
error Lottery__UpKeepNotNeeded(
    uint256 currentBalance,
    uint256 numOfPlayers,
    uint256 raffleState
);

// Contract
contract DecentralizedLottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    // State Variables
    uint256 private immutable entranceFee; // Fee to get one lottery ticket.
    uint256 private lastTimeStamp;
    uint256 private immutable interval;

    address private recentWinner; // The most recent winner
    address payable[] private allPlayers;

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;

    // Variables for chainlink random number function;
    bytes32 private immutable gasLane;
    uint64 private immutable subscriptionId;
    uint32 private immutable callbackGasLimit;
    uint32 private constant NO_OF_WORDS = 1;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;

    // Enums
    enum LotteryState {
        OPEN,
        CALCULATING
    }
    LotteryState private _LotteryState;

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
        uint32 _callbackGasLimit,
        uint256 _interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        entranceFee = _entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        gasLane = _gasLane;
        subscriptionId = _subscriptionId;
        callbackGasLimit = _callbackGasLimit;
        _LotteryState = LotteryState.OPEN;
        lastTimeStamp = block.timestamp;
        interval = _interval;
    }

    // Modifiers
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

    // Get Lottery State
    function getLotteryState() public view returns (LotteryState) {
        return _LotteryState;
    }

    // Get Numbers of players
    function getNumbersOfPlayers() public view returns (uint256) {
        return allPlayers.length;
    }

    // Get last block timestamp
    function getLastTimeStamp() public view returns (uint256) {
        return lastTimeStamp;
    }

    // Get Num Words
    function getNumWords() public pure returns (uint256) {
        return NO_OF_WORDS;
    }

    // Get Interval
    function getInterval() public view returns (uint256) {
        return interval;
    }

    // Get Request confirmations
    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    // Functions

    // Enter the lottery ticket.
    function enterLottery() public payable notEnoughEthEntered {
        if (_LotteryState != LotteryState.OPEN) {
            revert Lottery__NotOpen();
        }
        allPlayers.push(payable(msg.sender));

        //   Emitting events
        emit lotteryEnter(msg.sender);
    }

    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (_LotteryState == LotteryState.OPEN);
        bool timePassed = ((block.timestamp - lastTimeStamp) > interval);
        bool hasPlayers = (allPlayers.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
        return (upkeepNeeded, "0x0");
    }

    // Pick a random number;
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__UpKeepNotNeeded(
                address(this).balance,
                allPlayers.length,
                uint256(_LotteryState)
            );
        }

        _LotteryState = LotteryState.CALCULATING;
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

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint256 index = randomWords[0] % allPlayers.length;
        address payable _recentWinner = allPlayers[index];
        recentWinner = _recentWinner;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Lottery__TransferToWinnerFailed();
        }
        emit winnerPicked(recentWinner);
        _LotteryState = LotteryState.OPEN;
        allPlayers = new address payable[](0);
        lastTimeStamp = block.timestamp;
    }
}
