/**
 * KortanaDEX Market Maker — Production v7.0 (Organic Battle Engine)
 * =======================================================================
 * Features:
 *  - Both Green (Buy) and Red (Sell) Bars for 100% organic traction
 *  - Probability Engine: Biased 65/35 toward Green to maintain up-trend
 *  - TractionProxy Relay: Bypasses Kortana RPC RLP size limits
 *  - Smart Approval: Auto-approves Proxy when needed
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX          = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
const PROXY        = "0x1D0E141610784A3f9350ac1FF7ca1b307b933f6A"; // TractionProxy v2

const GAS_PRICE    = 3n;       
const GAS_LIMIT    = 400_000;  

const BUY_CHANCE   = 0.65; // 65% Buy, 35% Sell 

const MIN_DNR      = 1.0;  // Bigger trades for better visibility
const MAX_DNR      = 4.5; 

const MIN_MS       = 3 * 60_000; 
const MAX_MS       = 10 * 60_000;

const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function s(uint256 amount) external" // Proxy sell
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
    res.end("Kortana Organic Battle Bot ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 7.0      ║");
  console.log("║   [ The Organic Battle Volume Engine ]       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Wallets Loaded: ${PRIVATE_KEYS.length} | Strategy: 65% Buy / 35% Sell`);
  console.log("───────────────────────────────────────────────");

  let cycle = 0;

  while (true) {
    cycle++;
    
    // Pick a random trader
    const randomKey = PRIVATE_KEYS[Math.floor(Math.random() * PRIVATE_KEYS.length)];
    const wallet = new ethers.Wallet(randomKey, provider);
    const dex = new ethers.Contract(DEX, ABI, wallet);
    const proxy = new ethers.Contract(PROXY, ABI, wallet);

    const sleepMs = Math.floor(rand(MIN_MS, MAX_MS));
    console.log(`\n[Cycle ${cycle}] Next trade by: ${wallet.address.slice(0,10)}... in ${(sleepMs/60000).toFixed(1)}m`);
    await sleep(sleepMs);

    try {
      const isBuy = Math.random() < BUY_CHANCE;

      if (isBuy) {
        // ── GREEN BAR ENGINE 🟢 ───────────────────────────────────────────
        const dnrBal = await provider.getBalance(wallet.address);
        if (dnrBal < ethers.parseEther("5.0")) continue;

        const buyDNR = rand(MIN_DNR, MAX_DNR).toFixed(4);
        const buyValue = ethers.parseEther(buyDNR);
        console.log(`  🏹 🟢 BUY  : Spending ${buyDNR} DNR to pump ktUSD`);

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value: buyValue, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Hash: ${tx.hash.slice(0,20)}...`);

      } else {
        // ── RED BAR ENGINE 🔴 ─────────────────────────────────────────────
        const ktBal = await dex.balanceOf(wallet.address);
        if (ktBal < ethers.parseEther("5.0")) {
            console.log(`     ⚠  Trader low on ktUSD. Switching to fallback BUY.`);
            // Fallback to buy if wallet is empty of ktUSD
            const buyDNR = rand(0.5, 1.5).toFixed(4);
            const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
                value: ethers.parseEther(buyDNR), gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
            });
            await tx.wait();
            console.log(`     ✅ Fallback BUY Success!`);
            continue;
        }

        const sellAmt = ktBal * BigInt(Math.floor(rand(10, 25))) / 100n;
        console.log(`  🏹 🔴 SELL : Trading ${fmt(sellAmt)} ktUSD for DNR (Proxy Relay)`);

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
        console.log(`     ✅ Success! Hash: ${tx.hash.slice(0,20)}...`);
      }

    } catch (err) {
      console.error(`  ⚠ Cycle Failed: ${err.message?.slice(0, 120)}`);
    }
  }
}

main().catch(console.error);
