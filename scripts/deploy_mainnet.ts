import { ethers } from "hardhat";
import hre from "hardhat";

const SEED_KTUSD = ethers.parseEther("312000"); // 312,000 ktUSD
const SEED_DNR   = ethers.parseEther("1000");   // 1,000 DNR (312,000 / 1,000 = 312)
const MINT_CAP   = ethers.parseEther("100000"); // 100k ktUSD/day
const MIN_COLL   = 150;                          // 150% collateral ratio

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const wdnrArtifact = await hre.artifacts.readArtifact("WDNR");
  const dexArtifact  = await hre.artifacts.readArtifact("KortanaMonoDEX");
  const iface        = new ethers.Interface(dexArtifact.abi);

  // Step 1 — Deploy WDNR
  console.log("\n[1/6] Deploying WDNR...");
  const wdnrTx = await deployer.sendTransaction({
    data: wdnrArtifact.bytecode,
    gasLimit: 1000000n,
    gasPrice: 1n,
  });
  const wdnrReceipt = await wdnrTx.wait();
  const wdnrAddress = wdnrReceipt!.contractAddress!;
  console.log("WDNR deployed at:", wdnrAddress);

  // Step 2 — Deploy KortanaMonoDEX
  console.log("\n[2/6] Deploying KortanaMonoDEX...");
  const constructorArgs = iface.encodeDeploy([deployer.address, wdnrAddress, MINT_CAP, MIN_COLL]);
  const dexData = dexArtifact.bytecode + constructorArgs.slice(2);
  const dexTx = await deployer.sendTransaction({
    data: dexData,
    gasLimit: 3000000n,
    gasPrice: 1n,
  });
  const dexReceipt = await dexTx.wait();
  const dexAddress = dexReceipt!.contractAddress!;
  console.log("KortanaMonoDEX deployed at:", dexAddress);

  // Step 3 — Mint seed ktUSD to deployer
  console.log("\n[3/6] Minting seed ktUSD...");
  const mintTx = await deployer.sendTransaction({
    to: dexAddress,
    data: iface.encodeFunctionData("mint", [deployer.address, SEED_KTUSD]),
    gasLimit: 500000n,
    gasPrice: 1n,
  });
  await mintTx.wait();

  // Step 4 — Seed the pool
  console.log("\n[4/6] Seeding liquidity pool...");
  const addLiqTx = await deployer.sendTransaction({
    to: dexAddress,
    data: iface.encodeFunctionData("addLiquidity", [
      SEED_KTUSD,
      ethers.parseEther("0"),
      ethers.parseEther("0"),
      deployer.address,
    ]),
    value: SEED_DNR,
    gasLimit: 1000000n,
    gasPrice: 1n,
  });
  await addLiqTx.wait();

  // Step 5 — Verify deployment
  console.log("\n[5/6] Verifying...");
  const reservesResult = await ethers.provider.call({
    to: dexAddress,
    data: iface.encodeFunctionData("getReserves"),
  });
  const [r0, r1] = iface.decodeFunctionResult("getReserves", reservesResult);
  console.log(`Reserves — DNR: ${ethers.formatEther(r0)}, ktUSD: ${ethers.formatEther(r1)}`);

  // Step 6 — Print summary
  console.log("\n[6/6] Deployment complete!");
  console.log("=".repeat(50));
  console.log("WDNR:         ", wdnrAddress);
  console.log("KortanaMonoDEX:", dexAddress);
  console.log("Chain ID:      9002 (Kortana Mainnet)");
  console.log("Explorer: https://explorer.mainnet.kortana.xyz/address/" + dexAddress);
}

main().catch(console.error);
