import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying kUSDT ONLY with account:", deployer.address);

  // Deploy BridgedUSDT (kUSDT)
  console.log("Deploying BridgedUSDT (kUSDT)...");
  const kUSDT = await ethers.deployContract("BridgedUSDT", [], {
     gasLimit: 5000000,
     type: 0
  });
  await kUSDT.waitForDeployment();
  const kusdtAddr = await kUSDT.getAddress();
  console.log("✅ kUSDT:", kusdtAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
