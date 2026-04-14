import { ethers } from "hardhat";
import hre from "hardhat";

const MINT_CAP   = ethers.parseEther("1000000"); // 1M ktUSD/day
const MIN_RATIO  = 150; // 150%

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 [LAUNCH] Initializing Hardened V2 Deployment...");
  console.log("Account:", deployer.address);

  // 1. Coordinates
  const WDNR_ADDR    = "0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3";
  const FACTORY_ADDR = "0x20A096cC7b435142856aB239fe43c2e245ed947e";
  const OPERATOR     = deployer.address;

  // 2. Load Artifact
  const dexArtifact = await hre.artifacts.readArtifact("KortanaMonoDEX");
  const iface = new ethers.Interface(dexArtifact.abi);

  // 3. Encode Constructor Args
  console.log("Encoding parameters...");
  const constructorArgs = iface.encodeDeploy([
    OPERATOR,
    WDNR_ADDR,
    FACTORY_ADDR,
    MINT_CAP,
    MIN_RATIO
  ]);

  // 4. Deploy
  const dexData = dexArtifact.bytecode + constructorArgs.slice(2);
  console.log("Broadcasting Hardened V2 Contract...");
  
  const tx = await deployer.sendTransaction({
    data: dexData,
    gasLimit: 6000000n,
    gasPrice: 3n, // 3 Gwei
  });

  console.log("Tx Hash:", tx.hash);
  const receipt = await tx.wait();
  const dexAddress = receipt!.contractAddress!;

  console.log("\n" + "=".repeat(60));
  console.log("🏆 [SUCCESS] HARDENED V2 DEX DEPLOYED!");
  console.log("Address:  ", dexAddress);
  console.log("Operator: ", OPERATOR);
  console.log("WDNR:     ", WDNR_ADDR);
  console.log("Factory:  ", FACTORY_ADDR);
  console.log("=".repeat(60));
  console.log("\nNEXT STEPS:");
  console.log("1. Update DEX_ADDRESS in frontend/src/lib/contracts.ts");
  console.log("2. Update DEX_ADDR in market-maker-v2/index.js");
  console.log("3. Seed initial liquidity using deployer wallet.");
}

main().catch(console.error);
