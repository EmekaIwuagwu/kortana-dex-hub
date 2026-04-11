import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Step 1: WDNR");
  const WDNR = await ethers.deployContract("WDNR", [], { gasLimit: 3000000, type: 0 });
  await WDNR.waitForDeployment();
  console.log("✅ WDNR:", await WDNR.getAddress());

  console.log("🚀 Step 2: KLP");
  const KLP = await ethers.deployContract("KLP", [], { gasLimit: 3000000, type: 0 });
  await KLP.waitForDeployment();
  console.log("✅ KLP:", await KLP.getAddress());
}

main().catch(console.error);
