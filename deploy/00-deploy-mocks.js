const { network } = require("hardhat");
const {developmentChains} = require('../helper-hardhat-config')

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINKS = 1e9;
const args = [BASE_FEE, GAS_PRICE_LINKS]
module.exports = async function ({getNamedAccounts, deployments}){
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId

    if(developmentChains.includes(network.name)) {
        log("local network detected.. deploying")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer, 
            log: true,
            args: args
        })
        log("Mocks Deployed")
        log("---------------------------------------")
    }
}

module.exports.tags = ['all', ['mocks']]
