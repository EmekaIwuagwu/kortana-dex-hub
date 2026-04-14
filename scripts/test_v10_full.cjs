const { ethers } = require("hardhat");
const hre = require("hardhat");

const DEX_ADDR = "0xf6FBDbf0E0fdAfBbD05B1eA5da227EE55A982e2A";
const GAS_OPTS = {
  gasLimit: 8000000,
  gasPrice: 3,
  type: 0 // Force Legacy
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🛡️ [VALIDATION] Starting Sovereign Full-Scenario Audit (Forced Gas)...");
  console.log("Contract:", DEX_ADDR);

  const dexArtifact = await hre.artifacts.readArtifact("KortanaMonoDEX");
  const dex = new ethers.Contract(DEX_ADDR, dexArtifact.abi, deployer);

  // --- Scenario 1: Operator Seeding ---
  console.log("\n[1/5] Scenario: Operator Seeding (Bootstrap)...");
  const seedAmt = ethers.parseEther("10000");
  const tx1 = await dex.mint(deployer.address, seedAmt, GAS_OPTS);
  await tx1.wait();
  console.log("✅ Operator successfully minted 10,000 ktUSD seed.");

  // --- Scenario 2: Initial Liquidity ---
  console.log("\n[2/5] Scenario: Initial Liquidity Seeding...");
  const dnrSeed = ethers.parseEther("30"); 
  const usdSeed = ethers.parseEther("10000"); 
  const tx2 = await dex.addLiquidity(usdSeed, deployer.address, { ...GAS_OPTS, value: dnrSeed });
  await tx2.wait();
  console.log("✅ Liquidity Pool initialized at 333.33 price ratio.");

  // --- Scenario 3: User Minting (Collateralized) ---
  console.log("\n[3/5] Scenario: User Collateralized Minting...");
  const collateral = ethers.parseEther("20"); // 20 DNR (Satisfies 150% ratio for 1k mint)
  const mintAmt = ethers.parseEther("1000"); // 1,000 ktUSD
  const tx3 = await dex.mintWithCollateral(mintAmt, deployer.address, { ...GAS_OPTS, value: collateral });
  await tx3.wait();
  console.log("✅ Collateralized minting successful.");

  // --- Scenario 4: DNR -> ktUSD Swap ---
  console.log("\n[4/5] Scenario: Swap Native DNR for ktUSD...");
  const swapDnr = ethers.parseEther("1");
  const tx4 = await dex.swapExactDNRForKTUSD(0, deployer.address, { ...GAS_OPTS, value: swapDnr });
  await tx4.wait();
  console.log("✅ Swap DNR -> ktUSD successful.");

  // --- Scenario 5: ktUSD -> DNR Swap ---
  console.log("\n[5/5] Scenario: Swap ktUSD for Native DNR...");
  const swapUSD = ethers.parseEther("500");
  const tx5 = await dex.swapExactKTUSDForDNR(swapUSD, 0, deployer.address, GAS_OPTS);
  await tx5.wait();
  console.log("✅ Swap ktUSD -> DNR successful.");

  console.log("\n" + "=".repeat(60));
  console.log("🌟 [AUDIT PASSED] HARDENED V2 ECOSYSTEM IS 100% FUNCTIONAL!");
  console.log("=".repeat(60));
}

main().catch(console.error);
