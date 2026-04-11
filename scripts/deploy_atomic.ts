import { ethers } from "hardhat";

/**
 * ATOMIC DEPLOY SCRIPT
 * =====================
 * Built to solve the KLP ownership mismatch bug.
 * All contracts are deployed in a single sequential script 
 * so addresses never drift between sessions.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("⚡ ATOMIC DEPLOY — Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DNR\n");

  // ─── 1. WDNR ────────────────────────────────────────────────────────
  process.stdout.write("Deploying WDNR... ");
  const WDNR = await ethers.deployContract("WDNR", [], { gasLimit: 3000000, type: 0 });
  await WDNR.waitForDeployment();
  const wdnrAddr = await WDNR.getAddress();
  console.log("✅", wdnrAddr);

  // ─── 2. Factory ─────────────────────────────────────────────────────
  process.stdout.write("Deploying Factory... ");
  const Factory = await ethers.deployContract("KortanaFactory", [deployer.address], { gasLimit: 4000000, type: 0 });
  await Factory.waitForDeployment();
  const factoryAddr = await Factory.getAddress();
  console.log("✅", factoryAddr);

  // ─── 3. MonoDEX (LP now INTERNAL — no KLP contract needed) ──────────
  process.stdout.write("Deploying KortanaMonoDEX... ");
  const MonoDEX = await ethers.deployContract("KortanaMonoDEX", [
    deployer.address,             // operator
    wdnrAddr,                     // token0 (WDNR)
    factoryAddr,                  // factory (for indexer compatibility)
    ethers.parseEther("1000000"), // 1M ktUSD mint cap
    150                           // 150% collateral ratio
  ], { gasLimit: 8000000, type: 0 });
  await MonoDEX.waitForDeployment();
  const monoAddr = await MonoDEX.getAddress();
  console.log("✅", monoAddr);

  // ─── 4. Register MonoDEX as official pair in Factory ───────────────
  process.stdout.write("Registering MonoDEX as unofficial Pair in Factory... ");
  await (await Factory.setPair(wdnrAddr, monoAddr, monoAddr, { gasLimit: 500000, type: 0 })).wait();
  console.log("✅ DISCOVERABLE BY INDEXERS");

  // ─── 6. Router ──────────────────────────────────────────────────────
  process.stdout.write("Deploying Router... ");
  const Router = await ethers.deployContract("KortanaRouter", [factoryAddr, wdnrAddr], { gasLimit: 4000000, type: 0 });
  await Router.waitForDeployment();
  const routerAddr = await Router.getAddress();
  console.log("✅", routerAddr);

  // ─── 7. Farm ────────────────────────────────────────────────────────
  process.stdout.write("Deploying Farm... ");
  const Farm = await ethers.deployContract("KortanaFarm", [ethers.parseEther("0.1")], { gasLimit: 4000000, type: 0 });
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();
  console.log("✅", farmAddr);

  // ─── 8. BridgedUSDT (kUSDT) ─────────────────────────────────────────
  process.stdout.write("Deploying BridgedUSDT (kUSDT)... ");
  const kUSDT = await ethers.deployContract("BridgedUSDT", [], { gasLimit: 4000000, type: 0 });
  await kUSDT.waitForDeployment();
  const kusdtAddr = await kUSDT.getAddress();
  console.log("✅", kusdtAddr);

  // ─── 9. Seed genesis pool (1 DNR = 385.90 ktUSD) ───────────────────────
  console.log("\n🌱 Seeding genesis liquidity pool (MASSIVE LIQUIDITY)...");
  
  // Target: 1 DNR = 385.90 ktUSD
  // Seeding 1,000,000 DNR to provide extreme price depth
  const seedDNR   = ethers.parseEther("1000000"); 
  const seedKTUSD = ethers.parseUnits((1000000 * 385.90).toFixed(0), 18);

  process.stdout.write(`  Minting ${ethers.formatEther(seedKTUSD)} ktUSD... `);
  await (await MonoDEX.mint(deployer.address, seedKTUSD, { gasLimit: 500000, type: 0 })).wait();
  console.log("✅");

  // Verify balance before proceeding
  const ktBal = await MonoDEX.balanceOf(deployer.address);
  console.log("  ktUSD balance on-chain:", ethers.formatEther(ktBal));
  if (ktBal < seedKTUSD) throw new Error("FATAL: ktUSD balance insufficient after mint");

  process.stdout.write(`  Adding genesis liquidity (1,000,000 DNR)... `);
  await (await MonoDEX.addLiquidity(
    seedKTUSD,
    0,              // no slippage protection on genesis
    0,
    deployer.address,
    { value: seedDNR, gasLimit: 5000000, type: 0 }
  )).wait();
  console.log("✅ 1 DNR = 385.90 ktUSD ANCHORED (EXTREME DEPTH)");

  // ─── 10. Fund Farm with initial DNR rewards ─────────────────────────
  process.stdout.write("Funding Farm with 200,000 DNR (Rewards)... ");
  await (await deployer.sendTransaction({ to: farmAddr, value: ethers.parseEther("200000"), gasLimit: 200000, type: 0 })).wait();
  console.log("✅");

  // ─── 11. Whitelist KLP pool in Farm ─────────────────────────────────
  process.stdout.write("Whitelisting MonoDEX KLP pool in Farm... ");
  await (await Farm.addPool(100, monoAddr, true, { gasLimit: 500000, type: 0 })).wait();
  console.log("✅");

  // ─── 12. Save to .env ───────────────────────────────────────────────
  const fs = require("fs");
  const envContent = `
NEXT_PUBLIC_WDNR_ADDRESS_MAINNET=${wdnrAddr}
NEXT_PUBLIC_DEX_ADDRESS_MAINNET=${monoAddr}
NEXT_PUBLIC_FACTORY_ADDRESS_MAINNET=${factoryAddr}
NEXT_PUBLIC_ROUTER_ADDRESS_MAINNET=${routerAddr}
NEXT_PUBLIC_FARM_ADDRESS_MAINNET=${farmAddr}
NEXT_PUBLIC_KUSDT_ADDRESS_MAINNET=${kusdtAddr}
NEXT_PUBLIC_KLP_ADDRESS_MAINNET=${monoAddr}
  `;
  fs.appendFileSync(".env", envContent);
  console.log("\n✅ Saved to .env");

  // ─── FINAL SUMMARY ──────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║       🚀 KORTANA MODULAR SUITE — DEPLOYED (MAINNET)       ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  WDNR:    ${wdnrAddr}  ║`);
  console.log(`║  MONODEX: ${monoAddr}  ║`);
  console.log(`║  FACTORY: ${factoryAddr}  ║`);
  console.log(`║  ROUTER:  ${routerAddr}  ║`);
  console.log(`║  FARM:    ${farmAddr}  ║`);
  console.log(`║  kUSDT:   ${kusdtAddr}  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝");
}

main().catch((e) => {
  console.error("\n❌ DEPLOY FAILED:", e.shortMessage || e.message);
  process.exit(1);
});
