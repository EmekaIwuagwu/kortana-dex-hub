import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const monoAddr = "0x9Fe28b717aDE38BA99E32c45BE3Ee4291f2E338B";
  const klpAddr = "0x82B642D9deDb3Ad19b8E99FF3792A49d4d9d85Bf";
  const farmAddr = "0x199c27B10a195ee79e02d50846e59A4aFB82CAD1";

  const MonoDEX = await ethers.getContractAt("KortanaMonoDEX", monoAddr);
  const Farm = await ethers.getContractAt("KortanaFarm", farmAddr);

  console.log("🚀 Step 9: Seed Pool (Retrying with 4M gas)");
  const seedKTUSD = ethers.parseEther("312000");
  const seedDNR = ethers.parseEther("1000");

  console.log("Adding Liquidity...");
  await (await MonoDEX.addLiquidity(seedKTUSD, 0, 0, deployer.address, { value: seedDNR, gasLimit: 4000000, type: 0 })).wait();
  console.log("✅ Pool Seeded");

  console.log("🚀 Step 10: Fund Farm");
  await (await deployer.sendTransaction({ to: farmAddr, value: ethers.parseEther("10000"), gasLimit: 500000, type: 0 })).wait();
  console.log("✅ Farm Funded");

  console.log("🚀 Step 11: Whitelist KLP in Farm");
  await (await Farm.addPool(100, klpAddr, true, { gasLimit: 500000, type: 0 })).wait();
  console.log("✅ KLP Whitelisted");
}

main().catch(console.error);
