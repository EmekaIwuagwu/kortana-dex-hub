import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying KortanaFarm ONLY with account:", deployer.address);

  // Deploy KortanaFarm
  console.log("Deploying KortanaFarm...");
  const rewardRate = ethers.parseEther("0.1");
  const Farm = await ethers.deployContract("KortanaFarm", [rewardRate], {
     gasLimit: 8000000,
     type: 0
  });
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();
  console.log("✅ Farm:", farmAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
