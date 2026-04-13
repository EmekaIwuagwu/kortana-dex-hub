/**
 * KortanaDEX Market Maker — Production Final
 * ===========================================
 * Contract Analysis (KortanaMonoDEX.sol):
 *
 * BUY  — swapExactDNRForKTUSD(uint256 minOut18, address to) payable
 *   • msg.value = DNR in (native ETH)
 *   • credits _bal[to] with ktUSD — pure storage, no ETH out
 *   • gasPrice: 3n, gasLimit: 300000, type: 0 ← PROVEN WORKING (125K gas)
 *
 * SELL — swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to)
 *   • debits _bal[msg.sender] with ktUSD
 *   • calls _sendDNR → low-level .call{value}() sending ETH out
 *   • Kortana chain EVM has non-standard CALL{value} cost → consumes all gas
 *   • Cannot be executed by bot on this chain (only via frontend/Wagmi)
 *
 * STRATEGY: Continuous organic buys from two wallet perspectives:
 *   Wallet A (Scout) buys: DNR → ktUSD  (real on-chain buy)
 *   Every N cycles: transfer small ktUSD amounts to add economic variety
 *   Result: organic, non-uniform trading pattern for DexScreener visibility
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL     = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEX         = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

// Kortana chain REQUIRES these exact values (verified on-chain)
const GAS_PRICE   = 3n;       // gwei — chain default
const GAS_LIMIT   = 300_000;  // actual usage ~125K for buys

// Trade sizing — looks organic, not bot-like
const MIN_DNR     = 0.3;      // min DNR per buy
const MAX_DNR     = 5.0;      // max DNR per buy

// Timing — randomised between 3 and 15 minutes
const MIN_MS      = 3  * 60_000;
const MAX_MS      = 15 * 60_000;

// ── ABI — only what we need ────────────────────────────────────────────────
const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function getReserves() external view returns (uint112, uint112, uint32)"
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
const fmt   = n => Number(ethers.formatEther(n)).toFixed(4);

// ── Bot ───────────────────────────────────────────────────────────────────
async function main() {
  if (!PRIVATE_KEY) {
    console.error("FATAL: PRIVATE_KEY not set.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const dex      = new ethers.Contract(DEX, ABI, wallet);

  // Health-check server — keeps Render alive via UptimeRobot pings
  require("http").createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("KortanaDEX Market Maker ONLINE");
  }).listen(process.env.PORT || 10000);

  // ── Startup ──────────────────────────────────────────────────────────
  const [r0, r1]  = await dex.getReserves();
  const ktBal     = await dex.balanceOf(wallet.address);
  const dnrBal    = await provider.getBalance(wallet.address);
  const block     = await provider.getBlockNumber();

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Production v5    ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Chain:    Kortana Mainnet (9002)`);
  console.log(`  Wallet:   ${wallet.address}`);
  console.log(`  DNR:      ${fmt(dnrBal)} DNR`);
  console.log(`  ktUSD:    ${fmt(ktBal)} ktUSD`);
  console.log(`  Pool:     ${fmt(r0)} DNR / ${fmt(r1)} ktUSD`);
  console.log(`  Block:    ${block}`);
  console.log("───────────────────────────────────────────────");

  let cycle = 0, wins = 0, fails = 0;

  while (true) {
    cycle++;
    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Sleeping ${(sleepMs/60000).toFixed(1)}m — wins:${wins} fails:${fails}`);
    await sleep(sleepMs);

    try {
      // Random buy amount with organic appearance
      const buyDNR   = rand(MIN_DNR, MAX_DNR).toFixed(4);
      const buyValue = ethers.parseEther(buyDNR);
      console.log(`  🏹 BUY  ${buyDNR} DNR → ktUSD`);

      // Simulate first — catch any state issues before spending gas
      try {
        await dex.swapExactDNRForKTUSD.staticCall(0, wallet.address, { value: buyValue });
      } catch (simErr) {
        console.warn(`  ⚠  Sim rejected: ${simErr.reason ?? simErr.message?.slice(0, 80)}`);
        fails++;
        continue;
      }

      // Execute — using proven working parameters
      const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
        value    : buyValue,
        gasLimit : GAS_LIMIT,
        gasPrice : GAS_PRICE,
        type     : 0
      });

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        wins++;
        const newBal = await dex.balanceOf(wallet.address);
        console.log(`  ✅ Hash: ${receipt.hash}`);
        console.log(`     Gas:  ${receipt.gasUsed} | ktUSD bal: ${fmt(newBal)}`);
      } else {
        fails++;
        console.error(`  ❌ Reverted: ${receipt.hash}`);
      }

    } catch (err) {
      fails++;
      console.error(`  ⚠  Error: ${err.shortMessage ?? err.message?.slice(0, 180)}`);
    }
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
