const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚜 Setting up Kortana Farm on MAINNET with account:", deployer.address);

  // Mainnet Addresses
  const monoAddr = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  const farmAddr = "0xe876DC33456E27eEB1FB5Fb967ce3DfB1C88180E";

  const Farm = await ethers.getContractAt("KortanaFarm", farmAddr);

  console.log("Adding DNR/ktUSD (MonoDEX) LP pool to the Mainnet Farm...");
  
  // Checking if pool already exists
  const poolLen = await Farm.poolLength();
  console.log("Current pool count:", poolLen.toString());

  // allocPoint = 1000, pid=0 usually
  const tx = await Farm.addPool(1000, monoAddr, true, {
    gasLimit: 1000000,
    gasPrice: 1
  });
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  console.log("✅ Pool Added to Mainnet! Users can now stake their KLP tokens to earn rewards.");
  console.log("Address:", farmAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
