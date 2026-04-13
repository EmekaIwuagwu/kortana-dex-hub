/**
 * KortanaDEX Market Maker — Production v6.1 (Multi-Wallet Organic Edition)
 * =======================================================================
 * Solves the "Traction" requirement from CMC (CoinMarketCap).
 * 
 * Features:
 *  - Supports multiple private keys (comma-separated in .env)
 *  - Randomly selects a "trader" for each cycle to look like community interest
 *  - Maintains organic timing (3-15 min)
 *  - Proven parameters for Kortana Mainnet
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL     = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX         = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

const GAS_PRICE   = 3n;       
const GAS_LIMIT   = 300_000;  

const MIN_DNR     = 0.5;      
const MAX_DNR     = 4.5;      

const MIN_MS      = 4  * 60_000; 
const MAX_MS      = 12 * 60_000;

const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function getReserves() external view returns (uint112, uint112, uint32)"
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
const fmt   = n => Number(ethers.formatEther(n)).toFixed(4);

async function main() {
  if (PRIVATE_KEYS.length === 0) {
    console.error("FATAL: No PRIVATE_KEYS found in environment.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
  
  // Health-check server
  require("http").createServer((req, res) => {
    res.writeHead(200);
    res.end("Kortana Multi-Wallet Bot ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 6.1      ║");
  console.log("║   [ Building CMC Industry Traction ]         ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Connected to: ${RPC_URL}`);
  console.log(`  Wallets Loaded: ${PRIVATE_KEYS.length}`);
  console.log("───────────────────────────────────────────────");

  let cycle = 0, wins = 0, fails = 0;

  while (true) {
    cycle++;
    
    // Pick a random wallet from the list
    const randomKey = PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)];
    const wallet = new ethers.Wallet(randomKey, provider);
    const dex = new ethers.Contract(DEX, ABI, wallet);

    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Next trade by: ${wallet.address.slice(0,10)}... in ${(sleepMs/60000).toFixed(1)}m`);
    await sleep(sleepMs);

    try {
      const dnrBal = await provider.getBalance(wallet.address);
      if (dnrBal < ethers.parseEther("5.0")) {
         console.warn(`  ⚠ Wallet ${wallet.address.slice(0,6)} is low on DNR (${fmt(dnrBal)}). Skipping.`);
         continue;
      }

      const buyDNR   = rand(MIN_DNR, MAX_DNR).toFixed(4);
      const buyValue = ethers.parseEther(buyDNR);
      console.log(`  🏹 Trader ${wallet.address.slice(0,6)} BUYING ${buyDNR} DNR`);

      try {
        await dex.swapExactDNRForKTUSD.staticCall(0, wallet.address, { value: buyValue });
      } catch (simErr) {
        console.warn(`  ⚠ Sim rejected: ${simErr.message?.slice(0, 50)}`);
        continue;
      }

      const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
        value    : buyValue,
        gasLimit : GAS_LIMIT,
        gasPrice : GAS_PRICE,
        type     : 0
      });

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        wins++;
        console.log(`  ✅ Success! Hash: ${receipt.hash.slice(0,20)}...`);
      } else {
        fails++;
        console.error(`  ❌ Reverted: ${receipt.hash}`);
      }

    } catch (err) {
      fails++;
      console.error(`  ⚠ Error: ${err.message?.slice(0, 100)}`);
    }
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
