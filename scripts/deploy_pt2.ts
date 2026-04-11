import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const wdnrAddr = "0x90352F820342f8BE0012848bCB8aBd37877d7ec2";
  const klpAddr = "0x82B642D9deDb3Ad19b8E99FF3792A49d4d9d85Bf";

  console.log("🚀 Step 3: MonoDEX");
  const mintCap = ethers.parseEther("1000000");
  const minCollRatio = 150;
  const MonoDEX = await ethers.deployContract("KortanaMonoDEX", [deployer.address, wdnrAddr, klpAddr, mintCap, minCollRatio], { gasLimit: 8000000, type: 0 });
  await MonoDEX.waitForDeployment();
  const monoAddr = await MonoDEX.getAddress();
  console.log("✅ MonoDEX:", monoAddr);

  console.log("🚀 Step 4: KLP Ownership");
  const KLP = await ethers.getContractAt("KLP", klpAddr);
  const tx = await KLP.transferOwnership(monoAddr, { gasLimit: 500000, type: 0 });
  await tx.wait();
  console.log("✅ KLP Ownership Transferred");
}

main().catch(console.error);
