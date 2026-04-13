const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying KortanaSellProxy from:", deployer.address);

    const Proxy = await ethers.getContractFactory("KortanaSellProxy");
    const proxy = await Proxy.deploy();
    await proxy.waitForDeployment();

    const addr = await proxy.getAddress();
    console.log("✅ KortanaSellProxy deployed to:", addr);
    console.log("DEX hardcoded:", await proxy.DEX());
    return addr;
}

main().catch((e) => { console.error(e); process.exit(1); });
