const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

if (!developmentChains.includes(network.name)) {
  describe.skip;
} else {
  describe("DecentralizedLottery", () => {
    let decentralizedLottery,
      vrfCoordinatorV2Mock,
      entranceFee,
      interval,
      deployer;
    const chainId = network.config.chainId;

    beforeEach(async () => {
      deployer = (await getNamedAccounts()).deployer;
      await deployments.fixture(["all"]);
      decentralizedLottery = await ethers.getContract(
        "DecentralizedLottery",
        deployer
      );
    });

    describe("fulfillRandomWords", function () {
      it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
        console.log("Setting up test...");
        const startingTimeStamp = await decentralizedLottery.getLastTimeStamp();
        const accounts = await ethers.getSigners();

        console.log("Setting up Listener...");
        await new Promise(async (resolve, reject) => {


          decentralizedLottery.once("WinnerPicked", async () => {
            console.log("WinnerPicked event fired!");
            try {
              // add our asserts here
              const recentWinner = await decentralizedLottery.getRecentWinner();
              const lotteryState = await decentralizedLottery.getLotteryState();
              const winnerEndingBalance = await accounts[0].getBalance();
              const endingTimeStamp = await decentralizedLottery.getLastTimeStamp();

              await expect(decentralizedLottery.getPlayer(0)).to.be.reverted;
              assert.equal(recentWinner.toString(), accounts[0].address);
              assert.equal(lotteryState, 0);
              assert.equal(
                winnerEndingBalance.toString(),
                winnerStartingBalance.add(entranceFee).toString()
              );
              assert(endingTimeStamp > startingTimeStamp);
              resolve();
            } catch (error) {
              console.log(error);
              reject(error);
            }
          });
          // Then entering the lottery 
          console.log("Entering decentralizedLottery...");
          const tx = await decentralizedLottery.enterLottery({ value: entranceFee });
          await tx.wait(1);
          console.log("Ok, time to wait...");
          const winnerStartingBalance = await accounts[0].getBalance();

          // and this code WONT complete until our listener has finished listening!
        });
      });
    });
  });
}
