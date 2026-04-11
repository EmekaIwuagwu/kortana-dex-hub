const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const dexAddr = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

  console.log("🛠️ Deploying ktUSD Token Proxy for Trackers...");
  
  const Proxy = await ethers.getContractFactory("KortanaStableToken");
  const proxy = await Proxy.deploy(dexAddr, {
    gasLimit: 3000000,
    gasPrice: 1
  });
  await proxy.waitForDeployment();
  const proxyAddr = await proxy.getAddress();
  
  console.log("✅ ktUSD Proxy deployed at:", proxyAddr);
  console.log("Use this address as the 'Quote Token' or 'ktUSD Address' in all listing forms.");
}

main().catch(console.error);
