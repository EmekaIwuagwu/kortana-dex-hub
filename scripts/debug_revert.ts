import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const monoAddr = "0x9Fe28b717aDE38BA99E32c45BE3Ee4291f2E338B";

  const MonoDEX = await ethers.getContractAt("KortanaMonoDEX", monoAddr);

  console.log("🚀 Testing with 20M Gas and Error Catching...");
  const seedKTUSD = ethers.parseEther("312000");
  const seedDNR = ethers.parseEther("1000");

  try {
    const tx = await MonoDEX.addLiquidity(seedKTUSD, 0, 0, deployer.address, { 
      value: seedDNR, 
      gasLimit: 20000000, 
      type: 0 
    });
    const receipt = await tx.wait();
    console.log("✅ SUCCESS! Gas used:", receipt?.gasUsed.toString());
  } catch (error: any) {
    console.error("❌ REVERTED!");
    if (error.data) {
       console.error("Error data:", error.data);
    } else {
       console.error(error);
    }
  }
}

main().catch(console.error);
