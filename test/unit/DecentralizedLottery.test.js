const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

if (!developmentChains.includes(network.name)) {
  describe.skip;
} else {
  describe("DecentralizedLottery", async () => {
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

  });
}
