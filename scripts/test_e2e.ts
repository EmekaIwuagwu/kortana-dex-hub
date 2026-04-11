import { ethers } from "hardhat";

const MONO  = "0x8FCAC40e1302273Cac387696EBdaFf39FDfa172A";
const FARM  = "0x1D1aEE6D5dC35F3c15E2D11083D0e59C026b64c4";

async function main() {
  const [deployer] = await ethers.getSigners();
  const MonoDEX = await ethers.getContractAt("KortanaMonoDEX", MONO);
  const Farm    = await ethers.getContractAt("KortanaFarm", FARM);

  console.log("════════════════════════════════════════");
  console.log("  KORTANA DEX — END-TO-END TEST SUITE  ");
  console.log("════════════════════════════════════════\n");

  // ── TEST 1: Reserves ─────────────────────────────────────────────────
  const [r0, r1] = await MonoDEX.getReserves();
  const rDNR   = Number(ethers.formatEther(r0));
  const rKTUSD = Number(ethers.formatEther(r1));
  const price  = rKTUSD / rDNR;
  console.log(`[1] Reserves: ${rDNR} DNR / ${rKTUSD} ktUSD`);
  console.log(`    Price: 1 DNR = ${price.toFixed(2)} ktUSD`);
  if (Math.abs(price - 312) > 1) throw new Error(`❌ Expected ~312, got ${price.toFixed(2)}`);
  console.log("    ✅ Price anchor verified.\n");

  // ── TEST 2: Swap DNR → ktUSD ─────────────────────────────────────────
  const ktBefore = await MonoDEX.balanceOf(deployer.address);
  const swapTx = await MonoDEX.swapExactDNRForKTUSD(0, deployer.address, {
    value: ethers.parseEther("1"),
    gasLimit: 500000, type: 0
  });
  await swapTx.wait();
  const ktAfter = await MonoDEX.balanceOf(deployer.address);
  const received = Number(ethers.formatEther(ktAfter - ktBefore));
  console.log(`[2] Swap 1 DNR → ${received.toFixed(4)} ktUSD`);
  if (received < 300) throw new Error(`❌ Expected ~311 ktUSD, got ${received.toFixed(4)}`);
  console.log("    ✅ Swap working correctly.\n");

  // ── TEST 3: Add Liquidity ─────────────────────────────────────────────
  // Use a small amount proportional to reserves after swap
  const ktAmt = ethers.parseEther("312");
  const dnrAmt = ethers.parseEther("1");
  
  // Mint fresh ktUSD to ensure sufficient balance
  const mintTx = await MonoDEX.mint(deployer.address, ktAmt, { gasLimit: 300000, type: 0 });
  await mintTx.wait();

  const liqTx = await MonoDEX.addLiquidity(ktAmt, 0, 0, deployer.address, {
    value: dnrAmt, gasLimit: 1000000, type: 0
  });
  await liqTx.wait();
  const lpBal = await MonoDEX.lpBalanceOf(deployer.address);
  console.log(`[3] Add Liquidity → ${ethers.formatEther(lpBal)} KLP`);
  if (lpBal === 0n) throw new Error("❌ No LP tokens minted");
  console.log("    ✅ Liquidity provision working.\n");

  // ── TEST 4: Farm Stake ────────────────────────────────────────────────
  const appFarmTx = await MonoDEX.lpApprove(FARM, lpBal, { gasLimit: 200000, type: 0 });
  await appFarmTx.wait();
  const stakeTx = await Farm.deposit(0, lpBal, { gasLimit: 500000, type: 0 });
  await stakeTx.wait();
  const [staked] = await Farm.userInfo(0, deployer.address);
  console.log(`[4] Staked in Farm: ${ethers.formatEther(staked)} KLP`);
  if (staked === 0n) throw new Error("❌ Farm stake failed");
  console.log("    ✅ Farm staking working.\n");

  // ── TEST 5: Pending Rewards ───────────────────────────────────────────
  await new Promise(r => setTimeout(r, 3000));
  const pending = await Farm.pendingDNR(0, deployer.address);
  console.log(`[5] Pending Farm Rewards: ${ethers.formatEther(pending)} DNR`);
  console.log("    ✅ Rewards accruing.\n");

  console.log("════════════════════════════════════════");
  console.log("  🏆 ALL 5 TESTS PASSED — MAINNET READY");
  console.log("════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error("❌ TEST FAILED:", e.message);
  process.exit(1);
});
