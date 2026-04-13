const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying KortanaDNRWithdrawWrapper from:", deployer.address);

    const Wrapper = await ethers.getContractFactory("KortanaDNRWithdrawWrapper");
    const wrapper = await Wrapper.deploy();
    await wrapper.waitForDeployment();

    const addr = await wrapper.getAddress();
    console.log("✅ KortanaDNRWithdrawWrapper deployed to:", addr);
    console.log("DEX hardcoded:", await wrapper.DEX());
    return addr;
}

main().catch((e) => { console.error(e); process.exit(1); });
