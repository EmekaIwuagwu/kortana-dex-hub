/**
 * KortanaDEX Market Maker — Production v9.0 (The Dual-Engine Edition)
 * =======================================================================
 * Strategy:
 *  - TWO-WAY trading: Buys DNR (ktUSD→DNR) AND Sells DNR (DNR→ktUSD)
 *  - NET BIAS: 70% of actions BUY DNR (spend ktUSD) to push price UP
 *  - 30% of actions SELL DNR (spend DNR) to create realistic organic volume
 *  - Direct DEX interaction — no proxy contract needed
 *  - Full approval lifecycle management for ktUSD spending
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX          = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45"; // KortanaMonoDEX

const GAS_PRICE    = 3n;
const GAS_LIMIT    = 800_000;

// ── Strategy Config ────────────────────────────────────────────────────────
// DNR_BUY_CHANCE = probability of "Buy DNR" (spend ktUSD) each cycle
// This pushes the DNR price UP over time.
// 30% = "Sell DNR" (spend DNR, get ktUSD) = creates realistic organic volume
const DNR_BUY_CHANCE = 0.70; // 70% Buy DNR / 30% Sell DNR

// How much DNR to spend on "Sell DNR" cycles (organic red bars)
const MIN_DNR_SELL = 2.0;
const MAX_DNR_SELL = 6.0;

// How much ktUSD to spend on "Buy DNR" cycles (price-pushing green bars)
// Adjusted to match actual wallet balances (smallest wallet has ~6877 ktUSD)
const MIN_KTUSD_BUY = 200.0;
const MAX_KTUSD_BUY = 1000.0;

// Wait between cycles
const MIN_MS = 2 * 60_000; // 2 minutes
const MAX_MS = 6 * 60_000; // 6 minutes

// Minimum balances to skip a cycle
const MIN_DNR_BALANCE_FOR_SELL  = 5.0;   // Need at least 5 DNR to do a sell cycle
const MIN_KTUSD_BALANCE_FOR_BUY = 200.0; // Need at least 200 ktUSD to do a buy cycle

// ── ABI ───────────────────────────────────────────────────────────────────
const ABI = [
  // Core swap functions
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external",
  // ERC-20 (ktUSD)
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  // AMM state
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
const fmt   = n => Number(ethers.formatEther(n)).toFixed(4);

// ── Ensure ktUSD Approval ─────────────────────────────────────────────────
async function ensureApproval(dex, wallet, amountNeeded) {
  const owner   = wallet.address;
  const spender = DEX;
  const current = await dex.allowance(owner, spender);
  if (current >= amountNeeded) return; // Already approved
  console.log(`     🔓 Approving ktUSD for DEX...`);
  const tx = await dex.approve(spender, ethers.MaxUint256, {
    gasPrice: GAS_PRICE, gasLimit: 150_000, type: 0,
  });
  await tx.wait();
  console.log(`     ✅ Approval confirmed.`);
}

// ── Main Loop ─────────────────────────────────────────────────────────────
async function main() {
  if (PRIVATE_KEYS.length === 0) {
    console.error("FATAL: No PRIVATE_KEYS found in environment.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });

  // Health-check server for Render
  require("http").createServer((req, res) => {
    res.writeHead(200);
    res.end("KortanaDEX Dual-Engine Market Maker ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 9.0            ║");
  console.log("║   [ The Dual-Engine Edition — Price Support Mode ] ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`  Strategy: 70% BUY DNR (price support) | 30% SELL DNR (volume)`);
  console.log(`  Target:   Organic Two-Way Volume with Net DNR Price Uptrend`);
  console.log("─────────────────────────────────────────────────────");

  let cycle = 0;

  while (true) {
    cycle++;
    const randomKey = PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)];
    const wallet    = new ethers.Wallet(randomKey, provider);
    const dex       = new ethers.Contract(DEX, ABI, wallet);

    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Trader ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} | Next action in ${(sleepMs / 60000).toFixed(1)}m`);
    await sleep(sleepMs);

    try {
      // ── Read Pool State ─────────────────────────────────────────────────
      const [r0Raw, r1Raw] = await dex.getReserves();
      const reserveDNR   = Number(ethers.formatEther(r0Raw));
      const reserveKTUSD = Number(ethers.formatEther(r1Raw));
      const currentPrice = reserveKTUSD > 0 && reserveDNR > 0
        ? (reserveKTUSD / reserveDNR).toFixed(4)
        : "N/A";

      console.log(`  📊 Pool: ${reserveDNR.toFixed(2)} DNR | ${reserveKTUSD.toFixed(2)} ktUSD | Price: 1 DNR = ${currentPrice} ktUSD`);

      // ── Pool Dry Guard ───────────────────────────────────────────────────
      if (reserveDNR < 1.0) {
        console.log("  ⚠️  Pool is dry — skipping cycle to protect reserves.");
        continue;
      }

      // ── Decide Action ────────────────────────────────────────────────────
      const isBuyDNR = Math.random() < DNR_BUY_CHANCE;

      if (isBuyDNR) {
        // ═══════════════════════════════════════════════════════════════════
        // 🟢 BUY DNR: Spend ktUSD → Receive DNR
        // This REMOVES DNR from the pool → DNR price goes UP ✅
        // ═══════════════════════════════════════════════════════════════════
        const ktUSDBalance = await dex.balanceOf(wallet.address);
        const ktUSDBalNum  = Number(ethers.formatEther(ktUSDBalance));

        if (ktUSDBalNum < MIN_KTUSD_BALANCE_FOR_BUY) {
          console.log(`  ⏭️  SKIP BUY: Insufficient ktUSD (${ktUSDBalNum.toFixed(2)} < ${MIN_KTUSD_BALANCE_FOR_BUY})`);
          continue;
        }

        const buyAmount    = rand(MIN_KTUSD_BUY, Math.min(MAX_KTUSD_BUY, ktUSDBalNum * 0.1));
        const buyAmountWei = ethers.parseEther(buyAmount.toFixed(6));

        console.log(`  🏹 🟢 BUY DNR : Spending ${buyAmount.toFixed(2)} ktUSD → Getting DNR (price UP ↑)`);

        await ensureApproval(dex, wallet, buyAmountWei);

        const tx = await dex.swapExactKTUSDForDNR(buyAmountWei, 0, wallet.address, {
          gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0,
        });
        await tx.wait();
        console.log(`     ✅ Success! DNR bought. Pool ratio adjusted. Price should rise.`);

      } else {
        // ═══════════════════════════════════════════════════════════════════
        // 🔴 SELL DNR: Spend DNR → Receive ktUSD
        // This ADDS DNR to the pool → creates organic volume / red bars
        // ═══════════════════════════════════════════════════════════════════
        const dnrBalance = await provider.getBalance(wallet.address);
        const dnrBalNum  = Number(ethers.formatEther(dnrBalance));

        if (dnrBalNum < MIN_DNR_BALANCE_FOR_SELL) {
          console.log(`  ⏭️  SKIP SELL: Insufficient DNR (${dnrBalNum.toFixed(2)} < ${MIN_DNR_BALANCE_FOR_SELL})`);
          continue;
        }

        const sellDNR  = rand(MIN_DNR_SELL, MAX_DNR_SELL).toFixed(4);
        const sellWei  = ethers.parseEther(sellDNR);

        console.log(`  🏹 🔴 SELL DNR: Spending ${sellDNR} DNR → Getting ktUSD (organic volume)`);

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value: sellWei, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0,
        });
        await tx.wait();
        console.log(`     ✅ Success! Organic volume bar printed. ktUSD received.`);
      }

    } catch (err) {
      const msg = err?.message || String(err);
      console.error(`  ⚠️  Error: ${msg.slice(0, 150)}`);
      await sleep(15_000); // 15s cooldown on error
    }
  }
}

main().catch(console.error);
