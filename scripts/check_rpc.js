const { ethers } = require("hardhat");
async function main() {
  const block = await ethers.provider.getBlockNumber();
  console.log("BLOCK_CHECK_SUCCESS:", block);
}
main().catch(console.error);
