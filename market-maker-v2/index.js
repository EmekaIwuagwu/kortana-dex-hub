/**
 * KortanaDEX Market Maker — Production v8.3 (The Magnet Edition)
 * =======================================================================
 * Features:
 *  - PROXY V3 (Magnet): Solves the EOA-transfer-revert bug permanently.
 *  - LIQUIDITY-AWARE: Only sells when the pool has juice.
 *  - MICRO-BATTLE: Maintains organic volume without dry-pool reverts.
 */
"use strict";
const { ethers } = require("ethers");
require("dotenv").config();

// ── Config ────────────────────────────────────────────────────────────────
const RPC_URL      = process.env.RPC_URL    || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEYS = (process.env.PRIVATE_KEY || "").split(",").map(k => k.trim()).filter(k => k.length > 0);
const DEX          = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
const PROXY        = "0x1C0904BEdC886F179cbDEFd18a5d2393F85CD535"; // PROXY V3 Magnet

const GAS_PRICE    = 3n;       
const GAS_LIMIT    = 800_000;  // High gas for maximum reliability

const BUY_CHANCE   = 0.70; // 70% Buy / 30% Sell 

const MIN_DNR      = 3.0; 
const MAX_DNR      = 8.0; 

const MIN_MS       = 2 * 60_000; 
const MAX_MS       = 6 * 60_000;

const ABI = [
  "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function s(uint256 amount) external",
  "function getReserves() external view returns (uint112, uint112, uint32)"
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
    res.end("Kortana Magnet Bot ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 8.3      ║");
  console.log("║   [ The Magnet Edition — Robust Mode ]       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`  Target: Zero-Failure Organic Volume Engine`);
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
      const [r0, r1] = await dex.getReserves();
      const isDry = (r0 < ethers.parseEther("1.0")); // Under 1 DNR = Dry
      
      const isBuy = isDry || (Math.random() < BUY_CHANCE);

      if (isBuy) {
        // ── WHALE BUY (DNR Magnet) 🟢 ─────────────────────────────────────
        const dnrBal = await provider.getBalance(wallet.address);
        if (dnrBal < ethers.parseEther("12.0")) continue;

        const buyDNR = rand(MIN_DNR, MAX_DNR).toFixed(4);
        const buyValue = ethers.parseEther(buyDNR);
        console.log(`  🏹 🟢 BUY  : Spending ${buyDNR} DNR to grow pool`);

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value: buyValue, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Pool Growth Recorded.`);

      } else {
        // ── MAGNET SELL (No Revert Mode) 🔴 ───────────────────────────────
        const ktBal = await dex.balanceOf(wallet.address);
        if (ktBal < ethers.parseEther("5.0")) continue;

        // Sell 0.1 to 1.0 ktUSD (Organic Micro-Red Bar)
        const sellAmt = ethers.parseEther(rand(0.1, 1.0).toFixed(4));
        console.log(`  🏹 🔴 SELL : Trading ${fmt(sellAmt)} ktUSD for DNR (Proxy V3)`);

        const allowance = await dex.allowance(wallet.address, PROXY);
        if (allowance < sellAmt) {
          console.log(`     🔓 Approving Magnet Proxy...`);
          const appTx = await dex.approve(PROXY, ethers.MaxUint256, { 
            gasPrice: GAS_PRICE, gasLimit: 250000, type: 0 
          });
          await appTx.wait();
        }

        const tx = await proxy.s(sellAmt, {
          gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Organic Red Bar Printed.`);
      }

    } catch (err) {
      console.error(`  ⚠ Warning: ${err.message?.slice(0, 100)}`);
      await sleep(15000); // 15s wait
    }
  }
}

main().catch(console.error);
