const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying TractionProxy from:", deployer.address);

    const Factory = await ethers.getContractFactory("TractionProxy");
    const proxy = await Factory.deploy();
    await proxy.waitForDeployment();

    const addr = await proxy.getAddress();
    console.log("✅ TractionProxy deployed to:", addr);
    return addr;
}

main().catch((e) => { console.error(e); process.exit(1); });
