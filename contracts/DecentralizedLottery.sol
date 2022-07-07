// SPDX-License-Identifier: MIT

pragma solidity ^0.8.6;



// Custom errors
error Lottery__NotOwner();
error Lottery__NotEnoughEthEntered();

// Contract
contract DecentralizedLottery {
    // State Variables
    uint256 private immutable entranceFee; // Fee to get one lottery ticket.

    address public owner; // Owner of the contract

    address payable[] private allPlayers;




    // Events
    event lotteryEnter(address indexed player);

    //    Constructor
    constructor(uint256 _entranceFee)
        
    {
        entranceFee = _entranceFee;
        owner = msg.sender;
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

    // Functions

    // Enter the lottery ticket.
    function enterLottery() public payable notEnoughEthEntered {
        allPlayers.push(payable(msg.sender));

        //   Emitting events
        emit lotteryEnter(msg.sender);
    }

}
