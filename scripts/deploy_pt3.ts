import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const wdnrAddr = "0xA82ED5224ba72f2f776e09B11DC99E30Ee65Da8d";

  console.log("🚀 Step 5: Factory");
  const Factory = await ethers.deployContract("KortanaFactory", [deployer.address], { gasLimit: 4000000, type: 0 });
  await Factory.waitForDeployment();
  const factoryAddr = await Factory.getAddress();
  console.log("✅ Factory:", factoryAddr);

  console.log("🚀 Step 6: Router");
  const Router = await ethers.deployContract("KortanaRouter", [factoryAddr, wdnrAddr], { gasLimit: 4000000, type: 0 });
  await Router.waitForDeployment();
  const routerAddr = await Router.getAddress();
  console.log("✅ Router:", routerAddr);

  console.log("🚀 Step 7: Farm");
  const Farm = await ethers.deployContract("KortanaFarm", [ethers.parseEther("0.1")], { gasLimit: 4000000, type: 0 });
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();
  console.log("✅ Farm:", farmAddr);

  console.log("🚀 Step 8: kUSDT");
  const kUSDT = await ethers.deployContract("BridgedUSDT", [], { gasLimit: 4000000, type: 0 });
  await kUSDT.waitForDeployment();
  const kusdtAddr = await kUSDT.getAddress();
  console.log("✅ kUSDT:", kusdtAddr);
}

main().catch(console.error);
