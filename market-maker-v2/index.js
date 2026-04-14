/**
 * KortanaDEX Market Maker — Production v10.0 (The Indestructible Edition)
 * =======================================================================
 * Features:
 *  - MANUAL ENCODING: Bypasses high-level binder errors (Zero "Empty Data" bugs)
 *  - LEGACY EVM SYNC: Uses Type 0 transactions for maximum Kortana RPC compatibility
 *  - 70/30 DUAL ENGINE: Net Buy Pressure (70%) to grow DNR price
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX_ADDR     = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

const GAS_PRICE    = ethers.parseUnits("3", "gwei"); // Use 3 Gwei consistently
const GAS_LIMIT    = 1000000; // Increased to 1M to handle ReentrancyGuard overhead

// ── Strategy ──────────────────────────────────────────────────────────────
const DNR_BUY_CHANCE = 0.70; 
const MIN_KTUSD_BUY  = 200.0;
const MAX_KTUSD_BUY  = 800.0;
const MIN_DNR_SELL   = 2.0;
const MAX_DNR_SELL   = 5.0;

const MIN_MS = 2 * 60_000;
const MAX_MS = 5 * 60_000;

// ── ABI Interface (Explicit) ──────────────────────────────────────────────
const INTERFACE = new ethers.Interface([
  "function swapExactDNRForKTUSD(uint256 minOut, address to) external payable",
  "function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external",
  "function balanceOf(address) external view returns (uint256)",
  "function getReserves() external view returns (uint112, uint112, uint32)"
]);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;

async function main() {
  if (PRIVATE_KEYS.length === 0) { console.error("FATAL: NO KEYS"); process.exit(1); }
  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });

  require("http").createServer((req, res) => {
    res.writeHead(200); res.end("V10 INDESTRUCTIBLE BOT ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 10.0           ║");
  console.log("║   [ The Indestructible Edition — ZERO FAILURE ]    ║");
  console.log("╚════════════════════════════════════════════════════╝");

  let cycle = 0;
  while (true) {
    cycle++;
    const key = PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)];
    const wallet = new ethers.Wallet(key, provider);
    
    // Refresh Pool State
    const dexRead = new ethers.Contract(DEX_ADDR, INTERFACE, provider);
    const [r0, r1] = await dexRead.getReserves();
    const price = (Number(r1) / Number(r0)).toFixed(4);

    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Bot ${wallet.address.slice(0,6)}... Price: ${price} | Next action in ${(sleepMs/60000).toFixed(1)}m`);
    await sleep(sleepMs);

    try {
      const isBuyDNR = Math.random() < DNR_BUY_CHANCE;

      if (isBuyDNR) {
        // 🟢 BUY DNR (Spend ktUSD)
        const ktUSDWei = await dexRead.balanceOf(wallet.address);
        const ktUSDBal = Number(ethers.formatEther(ktUSDWei));
        
        if (ktUSDBal < MIN_KTUSD_BUY) {
          console.log(`  ⏭️  Skip Buy: Low ktUSD (${ktUSDBal.toFixed(2)})`);
          continue;
        }

        const amt = rand(MIN_KTUSD_BUY, Math.min(MAX_KTUSD_BUY, ktUSDBal * 0.5));
        const amtWei = ethers.parseEther(amt.toFixed(6));
        
        console.log(`  🏹 🟢 BUY DNR: Spending ${amt.toFixed(2)} ktUSD (Pushing Price UP ↑)`);
        
        // --- MANUAL ENCODING (Indestructible) ---
        const data = INTERFACE.encodeFunctionData("swapExactKTUSDForDNR", [amtWei, 0, wallet.address]);
        const tx = await wallet.sendTransaction({
          to: DEX_ADDR,
          data: data,
          gasLimit: GAS_LIMIT,
          gasPrice: GAS_PRICE,
          type: 0 // Force Legacy for Kortana RPC
        });
        
        console.log(`     🛰️ Transaction Sent: ${tx.hash.slice(0,10)}... waiting...`);
        await tx.wait();
        console.log(`     ✅ Success! DNR price pushed.`);

      } else {
        // 🔴 SELL DNR (Spend DNR -> Native)
        const dnrWei = await provider.getBalance(wallet.address);
        const dnrBal = Number(ethers.formatEther(dnrWei));

        if (dnrBal < (MAX_DNR_SELL + 5)) {
          console.log(`  ⏭️  Skip Sell: Low DNR (${dnrBal.toFixed(2)})`);
          continue;
        }

        const amt = rand(MIN_DNR_SELL, MAX_DNR_SELL);
        const amtWei = ethers.parseEther(amt.toFixed(6));

        console.log(`  🏹 🔴 SELL DNR: Spending ${amt.toFixed(2)} DNR (Creating Volume)`);
        
        const data = INTERFACE.encodeFunctionData("swapExactDNRForKTUSD", [0, wallet.address]);
        const tx = await wallet.sendTransaction({
          to: DEX_ADDR,
          value: amtWei,
          data: data,
          gasLimit: GAS_LIMIT,
          gasPrice: GAS_PRICE,
          type: 0
        });

        console.log(`     🛰️ Transaction Sent: ${tx.hash.slice(0,10)}... waiting...`);
        await tx.wait();
        console.log(`     ✅ Success! Sell volume recorded.`);
      }
    } catch (err) {
      console.error(`  ⚠️ FATAL: ${err.message?.slice(0,150)}`);
      await sleep(10000);
    }
  }
}

main().catch(console.error);
