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
      vrfCoordinatorV2Mock = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
      );
      entranceFee = await decentralizedLottery.getEntranceFee();
      interval = await decentralizedLottery.getInterval();
    });

    // Checks for the values are assigned correctly in constructor;
    describe("constructor", () => {
      it("Check lottery state", async () => {
        const lotteryState = await decentralizedLottery.getLotteryState();
        assert.equal(lotteryState.toString(), "0");
      });
      it("Check lottery interval", async () => {
        assert.equal(interval, networkConfig[chainId]["interval"]);
      });
    });

    describe("enterLottery", () => {
      it("Check if it reverts successfully if the amount is less then the entrance fee.", async () => {
        await expect(decentralizedLottery.enterLottery()).to.be.revertedWith(
          "Lottery__NotEnoughEthEntered"
        );
      });

      it("push the players address if they enter lottery with entrance fee", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });
        const playerFromContract = await decentralizedLottery.getPlayer(0);
        assert.equal(playerFromContract, deployer);
      });

      it("emits the event when entering lottery", async () => {
        await expect(
          decentralizedLottery.enterLottery({ value: entranceFee })
        ).to.emit(decentralizedLottery, "lotteryEnter");
      });

      it("dosen't allow the lottery to enter when in calculating state", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        // await network.provider.request({method: "evm_mine", params: []})
        await decentralizedLottery.performUpkeep([]);
        await expect(
          decentralizedLottery.enterLottery({ value: entranceFee })
        ).to.be.revertedWith("Lottery__NotOpen");
      });
    });

    describe("checkUpKeep", () => {
      it("return false if there is no users who have paid.", async () => {
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        const { upkeepNeeded } =
          await decentralizedLottery.callStatic.checkUpkeep([]);
        assert(!upkeepNeeded);
      });

      it("returns false if raffle is not open", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        await decentralizedLottery.performUpkeep([]);
        const lotteryState = await decentralizedLottery.getLotteryState();
        const { upkeepNeeded } =
          await decentralizedLottery.callStatic.checkUpkeep([]);
        assert.equal(lotteryState.toString(), "1");
        assert.equal(upkeepNeeded, false);
      });

      it("returns false if enough time has not passed", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });

        // await network.provider.send("evm_increaseTime", [
        //   interval.toNumber() - 1,
        // ]);
        await network.provider.send("evm_mine", []);
        const { upkeepNeeded } =
          await decentralizedLottery.callStatic.checkUpkeep("0x");
        assert(!upkeepNeeded);
      });

      it("returns true if interval and all necessary things are true and has passed", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });

        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        const { upkeepNeeded } =
          await decentralizedLottery.callStatic.checkUpkeep("0x");
        assert(upkeepNeeded);
      });
    });

    describe("performUpkeep", () => {
      it("It only runs if checkupkeep function returns true", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        const tx = await decentralizedLottery.performUpkeep([]);
        assert(tx);
      });
      it("revert if the checkupkeep is false", async () => {
        await expect(decentralizedLottery.performUpkeep([])).to.be.revertedWith(
          "Lottery__UpKeepNotNeeded"
        );
      });

      it("updates the lottery state and calls the performUpkeep", async () => {
        await decentralizedLottery.enterLottery({ value: entranceFee });
        await network.provider.send("evm_increaseTime", [
          interval.toNumber() + 1,
        ]);
        await network.provider.send("evm_mine", []);
        const txResponse = await decentralizedLottery.performUpkeep([]);
        const txReceipt = await txResponse.wait(1);
        const requestId = txReceipt.events[1].args.requestId;
        const lotteryState = await decentralizedLottery.getLotteryState();
        assert(requestId.toNumber() > 0);
        assert(lotteryState.toString() == "1");
      });
    });

    
  });
}
