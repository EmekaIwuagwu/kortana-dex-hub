import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🔬 ENGINEER DIAGNOSIS: Checking KLP ownership chain...\n");

  // All previously deployed KLP addresses
  const klpAddrs = [
    "0x7290f72B5C67052DDE8e6E179F7803c493e90d3f",  // session 1
    "0x17C8b71E5eE01A726766c99d397D619219C8CAF3",  // session 2
    "0x82B642D9deDb3Ad19b8E99FF3792A49d4d9d85Bf",  // session 3
  ];

  // Latest MonoDEX address 
  const latestMono = "0x34E59e53Bd4f1A60ca8b6c21572509027571341d";
  console.log("Latest MonoDEX:", latestMono);

  for (const addr of klpAddrs) {
    try {
      const klp = await ethers.getContractAt("KLP", addr);
      const owner = await klp.owner();
      console.log(`KLP ${addr} → owner: ${owner} | matches: ${owner.toLowerCase() === latestMono.toLowerCase()}`);
    } catch(e) {
      console.log(`KLP ${addr} → ERROR reading`);
    }
  }
}

main().catch(console.error);
