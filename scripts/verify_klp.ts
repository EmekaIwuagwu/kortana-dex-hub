import { ethers } from "hardhat";

async function main() {
  const klpAddr = "0x82B642D9deDb3Ad19b8E99FF3792A49d4d9d85Bf";
  const monoAddr = "0x9Fe28b717aDE38BA99E32c45BE3Ee4291f2E338B";

  const KLP = await ethers.getContractAt("KLP", klpAddr);
  const owner = await KLP.owner();
  console.log("KLP Owner:", owner);
  console.log("Expected MonoDEX:", monoAddr);
}

main().catch(console.error);
