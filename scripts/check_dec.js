const { ethers } = require("hardhat");
async function main() {
  const wdnr = await ethers.getContractAt(["function decimals() view returns (uint8)"], "0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3");
  const ktusd = await ethers.getContractAt(["function decimals() view returns (uint8)"], "0xB2Bc15d9d9Ce9FbD85Df647D4C945514751D111e");
  console.log("WDNR_DECIMALS:", await wdnr.decimals());
  console.log("KTUSD_DECIMALS:", await ktusd.decimals());
}
main().catch(console.error);
