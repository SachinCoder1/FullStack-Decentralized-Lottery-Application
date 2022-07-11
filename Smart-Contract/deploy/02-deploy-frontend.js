const fs = require("fs");
const { ethers, network } = require("hardhat");
const FRONTEND_ADDRESSES_FILE = "../frontend/constants/contractAddresses.json";
const FRONTEND_ABI_FILE = "../frontend/constants/abi.json";

const updateContractAddress = async () => {
  const chainId = network.config.chainId.toString();
  const DecentralizedLottery = await ethers.getContract("DecentralizedLottery");
  const currentAddress = JSON.parse(
    fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf-8")
  );
  if (chainId in currentAddress) {
    if (!currentAddress[chainId].includes(DecentralizedLottery.address)) {
    }
  } else {
    currentAddress[chainId] = [DecentralizedLottery.address];
  }
  fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddress));
};

const updateAbi = async () => {
  const DecentralizedLottery = await ethers.getContract("DecentralizedLottery");
  fs.writeFileSync(
    FRONTEND_ABI_FILE,
    DecentralizedLottery.interface.format(ethers.utils.FormatTypes.json)
  );
};

module.exports = async () => {
  if (process.env.UPDATE_FRONTEND) {
    console.log("updating frontend......");
    updateContractAddress();
    updateAbi();
  }
};

module.exports.tags = ["all", "frontend"];
