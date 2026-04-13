const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const farmAddr = "0xe876DC33456E27eEB1FB5Fb967ce3DfB1C88180E";
  const Farm = await ethers.getContractAt("KortanaFarm", farmAddr);

  try {
    const dnrPerSec = await Farm.dnrPerSecond();
    console.log("DNR/sec: ", dnrPerSec.toString());
    console.log("DNR/day: ", (dnrPerSec * BigInt(86400) / BigInt(1e18)).toString());
    
    const balance = await ethers.provider.getBalance(farmAddr);
    console.log("Farm DNR Balance: ", ethers.formatEther(balance));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

main().catch(console.error);
