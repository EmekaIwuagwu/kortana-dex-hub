/**
 * KortanaDEX Institutional Market Maker v4.0
 * ============================================
 * Chain: Kortana Mainnet (ChainID 9002)
 * DEX:   KortanaMonoDEX — 0x8Ebb...CD45
 *
 * Engineering Notes:
 *  - MUST use gasPrice: 3n (chain default) and type: 0 (legacy)
 *  - BUY (swapExactDNRForKTUSD) — proven: 125,119 gas
 *  - SELL (swapExactKTUSDForDNR) — simulated first; skipped if RLP limit hit
 *  - Organic randomised timing to avoid wash-trade pattern detection
 *  - Simulate (eth_call) before EVERY real tx to pre-validate on-chain state
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Chain constants (do NOT change) ────────────────────────────────────────
const RPC_URL     = process.env.RPC_URL || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEX_ADDR    = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

const GAS_PRICE   = 3n;       // Kortana chain default (wei)
const GAS_BUY     = 300_000;  // proven: actual usage ~125K
const GAS_SELL    = 300_000;  // only executed if simulation passes

// ── Trade parameters ───────────────────────────────────────────────────────
const BUY_MIN_DNR  = 0.5;    // min DNR per buy cycle
const BUY_MAX_DNR  = 4.0;    // max DNR per buy cycle
const SELL_AMT     = "5.0";  // ktUSD to sell per cycle
const MIN_KTUSD    = 6.0;    // minimum ktUSD balance before attempting sell

// ── Timing (organic, non-wash-trade) ───────────────────────────────────────
const MIN_DELAY_MS = 3  * 60_000;  //  3 min
const MAX_DELAY_MS = 10 * 60_000;  // 10 min

// ── ABI ────────────────────────────────────────────────────────────────────
const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function getReserves() external view returns (uint112, uint112, uint32)"
];

// ── Helpers ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;

async function simulate(contract, fn, args, overrides = {}) {
  try {
    await contract[fn].staticCall(...args, overrides);
    return true;
  } catch (e) {
    console.warn(`  ⚠  [sim:${fn}] ${e.reason ?? e.message?.slice(0, 100)}`);
    return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  if (!PRIVATE_KEY) {
    console.error("FATAL: PRIVATE_KEY not set in environment.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const dex      = new ethers.Contract(DEX_ADDR, ABI, wallet);

  // ── Anti-sleep HTTP server (pinged by UptimeRobot) ─────────────────────
  require("http").createServer((req, res) => {
    res.writeHead(200);
    res.end("KortanaDEX Market Maker ONLINE");
  }).listen(process.env.PORT || 10000);

  // ── Startup info ───────────────────────────────────────────────────────
  const block     = await provider.getBlockNumber();
  const [r0, r1]  = await dex.getReserves();
  const ktBal     = await dex.balanceOf(wallet.address);
  const dnrBal    = await provider.getBalance(wallet.address);

  console.log("╔═══════════════════════════════════════════╗");
  console.log("║  KortanaDEX Market Maker  v4.0            ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Wallet  : ${wallet.address}`);
  console.log(`  DNR bal : ${ethers.formatEther(dnrBal)} DNR`);
  console.log(`  ktUSD   : ${ethers.formatEther(ktBal)} ktUSD`);
  console.log(`  Reserves: ${ethers.formatEther(r0)} DNR / ${ethers.formatEther(r1)} ktUSD`);
  console.log(`  Block   : ${block}`);
  console.log("─────────────────────────────────────────────");

  let cycle = 0;
  let buyCount = 0, sellCount = 0, skipCount = 0;

  while (true) {
    cycle++;
    // Randomised wait — produces organic, non-uniform trade intervals
    const waitMs = Math.floor(rand(MIN_DELAY_MS, MAX_DELAY_MS));
    console.log(`\n[#${cycle}] Next trade in ${(waitMs / 60000).toFixed(1)} min  (buys:${buyCount} sells:${sellCount} skips:${skipCount})`);
    await sleep(waitMs);

    // Decide action: 65% buy, 35% sell — weighted toward buys (healthy accumulation)
    const action = Math.random() < 0.65 ? "buy" : "sell";

    try {
      if (action === "buy") {
        const amt   = rand(BUY_MIN_DNR, BUY_MAX_DNR).toFixed(4);
        const value = ethers.parseEther(amt);
        console.log(`  🏹 BUY  ${amt} DNR → ktUSD`);

        const ok = await simulate(dex, "swapExactDNRForKTUSD", [0, wallet.address], { value });
        if (!ok) { skipCount++; console.log("     ⏭  skipped (sim rejected)"); continue; }

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value,
          gasLimit : GAS_BUY,
          gasPrice : GAS_PRICE,
          type     : 0
        });
        const receipt = await tx.wait();
        if (receipt.status === 1) {
          buyCount++;
          console.log(`     ✅ ${receipt.hash}  gas: ${receipt.gasUsed}`);
        } else {
          skipCount++;
          console.error(`     ❌ reverted on-chain: ${receipt.hash}`);
        }

      } else {
        // ── Sell path ──────────────────────────────────────────────────
        const bal = await dex.balanceOf(wallet.address);
        if (Number(ethers.formatEther(bal)) < MIN_KTUSD) {
          console.log(`  ⏳ SELL skipped — only ${ethers.formatEther(bal)} ktUSD (need ≥${MIN_KTUSD})`);
          skipCount++;
          continue;
        }

        const sellAmt = ethers.parseEther(SELL_AMT);
        console.log(`  ⚓ SELL ${SELL_AMT} ktUSD → DNR`);

        const ok = await simulate(dex, "swapExactKTUSDForDNR", [sellAmt, 0, wallet.address]);
        if (!ok) { skipCount++; console.log("     ⏭  skipped (sim rejected)"); continue; }

        try {
          const tx = await dex.swapExactKTUSDForDNR(sellAmt, 0, wallet.address, {
            gasLimit : GAS_SELL,
            gasPrice : GAS_PRICE,
            type     : 0
          });
          const receipt = await tx.wait();
          if (receipt.status === 1) {
            sellCount++;
            console.log(`     ✅ ${receipt.hash}  gas: ${receipt.gasUsed}`);
          } else {
            skipCount++;
            console.error(`     ❌ reverted on-chain: ${receipt.hash}`);
          }
        } catch (sellErr) {
          // Kortana RLP size limit — fall back to a buy this cycle instead
          console.warn(`     ⚠  Sell tx hit chain limit, running a buy instead`);
          const fallbackAmt   = rand(0.5, 2.0).toFixed(4);
          const fallbackValue = ethers.parseEther(fallbackAmt);
          const fbOk = await simulate(dex, "swapExactDNRForKTUSD", [0, wallet.address], { value: fallbackValue });
          if (fbOk) {
            const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
              value    : fallbackValue,
              gasLimit : GAS_BUY,
              gasPrice : GAS_PRICE,
              type     : 0
            });
            const r = await tx.wait();
            if (r.status === 1) { buyCount++; console.log(`     ✅ fallback buy ${fallbackAmt} DNR: ${r.hash}`); }
          }
        }
      }
    } catch (err) {
      skipCount++;
      console.error(`  ⚠  Cycle ${cycle} error: ${err.shortMessage ?? err.message?.slice(0, 150)}`);
    }
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
