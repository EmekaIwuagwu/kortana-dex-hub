import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚜 Setting up Kortana Farm with account:", deployer.address);

  // Current Testnet Addresses
  const monoAddr = "0x63cf2Cd54fE91e3545D1379abf5bfd194545259d";
  const farmAddr = "0xed17543171C1459714cdC6519b58fFcC29A3C3c9";

  const Farm = await ethers.getContractAt("KortanaFarm", farmAddr);

  console.log("Adding DNR/ktUSD (MonoDEX) LP pool to the Farm...");
  // allocPoint = 100
  const tx = await Farm.addPool(100, monoAddr, true, {
    gasLimit: 500000,
    type: 0
  });
  await tx.wait();
  console.log("✅ Pool Added! Users can now stake their KLP tokens.");

  const poolLength = await Farm.poolLength();
  console.log("Current total pools in Farm:", poolLength.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
