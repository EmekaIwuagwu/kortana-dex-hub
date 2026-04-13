const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying TractionProxyV3 from:", deployer.address);

    const Factory = await ethers.getContractFactory("TractionProxyV3");
    const proxy = await Factory.deploy();
    await proxy.waitForDeployment();

    const addr = await proxy.getAddress();
    console.log("✅ TractionProxyV3 deployed to:", addr);
    return addr;
}

main().catch((e) => { console.error(e); process.exit(1); });
