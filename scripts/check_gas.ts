import { ethers } from "hardhat";

async function main() {
  const block = await ethers.provider.getBlock("latest");
  console.log("Block Gas Limit:", block?.gasLimit.toString());
}

main().catch(console.error);
