/**
 * KortanaDEX Market Maker — Production v8.0 (Bullish Volume Engine)
 * =======================================================================
 * Features:
 *  - HIGH FREQUENCY: Trades every 2-5 minutes for massive volume.
 *  - WHALE BUYS: Buys 3.0 to 10.0 DNR to push the price aggressively UP.
 *  - ORGANIC SELLS: 35% chance of small 10-25% balance sells to look real.
 *  - PROXY RELAY: Bypasses all Kortana RPC size limits.
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX          = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
const PROXY        = "0x1D0E141610784A3f9350ac1FF7ca1b307b933f6A"; 

const GAS_PRICE    = 3n;       
const GAS_LIMIT    = 400_000;  

const BUY_CHANCE   = 0.65; // Bias for Green 

const MIN_DNR      = 3.0;  // HIGH VOLUME WHALE BUYS
const MAX_DNR      = 10.0; 

const MIN_MS       = 2 * 60_000; // 2 min min
const MAX_MS       = 5 * 60_000; // 5 min max

const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function s(uint256 amount) external" 
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
const fmt   = n => Number(ethers.formatEther(n)).toFixed(4);

async function main() {
  if (PRIVATE_KEYS.length === 0) {
    console.error("FATAL: No PRIVATE_KEYS found.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
  
  // Health-check server
  require("http").createServer((req, res) => {
    res.writeHead(200);
    res.end("Kortana Bullish Volume Bot ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 8.0      ║");
  console.log("║   [ The Bullish High-Frequency Engine ]      ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Target: High Volume & Constant Price Growth`);
  console.log(`  Strategy: 65% Whale-Buys | 35% Organic-Sells`);
  console.log("───────────────────────────────────────────────");

  let cycle = 0;

  while (true) {
    cycle++;
    
    const randomKey = PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)];
    const wallet = new ethers.Wallet(randomKey, provider);
    const dex = new ethers.Contract(DEX, ABI, wallet);
    const proxy = new ethers.Contract(PROXY, ABI, wallet);

    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Trader ${wallet.address.slice(0,6)}... Next action in ${(sleepMs/60000).toFixed(1)}m`);
    await sleep(sleepMs);

    try {
      const isBuy = Math.random() < BUY_CHANCE;

      if (isBuy) {
        // ── WHALE BUY 🐳 ──────────────────────────────────────────────────
        const dnrBal = await provider.getBalance(wallet.address);
        if (dnrBal < ethers.parseEther("15.0")) continue;

        const buyDNR = rand(MIN_DNR, MAX_DNR).toFixed(4);
        const buyValue = ethers.parseEther(buyDNR);
        console.log(`  🏹 🟢 WHALE BUY : Spending ${buyDNR} DNR to boost price`);

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value: buyValue, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Price Up.`);

      } else {
        // ── ORGANIC SELL 🐟 ────────────────────────────────────────────────
        const ktBal = await dex.balanceOf(wallet.address);
        if (ktBal < ethers.parseEther("10.0")) {
            // Fallback to buy if no ktUSD
            const buyDNR = rand(1.0, 3.0).toFixed(4);
            const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
                value: ethers.parseEther(buyDNR), gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
            });
            await tx.wait();
            console.log(`     ✅ Fallback Buy Success!`);
            continue;
        }

        const sellAmt = ktBal * BigInt(Math.floor(rand(10, 25))) / 100n;
        console.log(`  🏹 🔴 ORGANIC SELL : Trading ${fmt(sellAmt)} ktUSD for DNR`);

        const allowance = await dex.allowance(wallet.address, PROXY);
        if (allowance < sellAmt) {
          console.log(`     🔓 Approving Proxy...`);
          const appTx = await dex.approve(PROXY, ethers.MaxUint256, { gasPrice: GAS_PRICE, gasLimit: 100000, type: 0 });
          await appTx.wait();
        }

        const tx = await proxy.s(sellAmt, {
          gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Gas used: ${tx.gasLimit}`);
      }

    } catch (err) {
      console.error(`  ⚠ Cycle Pause: ${err.message?.slice(0, 100)}`);
      await sleep(10000); // 10s backoff
    }
  }
}

main().catch(console.error);
