/**
 * KortanaDEX Market Maker — Production v8.2 (Robust Micro-Battle Engine)
 * =======================================================================
 * Features:
 *  - MICRO-SELLS: Keeps sells tiny to avoid hitting the Liquidity Wall.
 *  - WHALE BUYS: Continues to pump DNR into the pool to grow liquidity.
 *  - PROXY RELAY: Bypass RLP limits.
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
const GAS_LIMIT    = 500_000;  

const BUY_CHANCE   = 0.75; // 75% Buy to build pool fast

const MIN_DNR      = 2.0; 
const MAX_DNR      = 6.0; 

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
    res.end("Kortana Micro-Battle Bot ONLINE");
  }).listen(process.env.PORT || 10000);

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   KortanaDEX Market Maker — Version 8.2      ║");
  console.log("║   [ Building Liquidity & Traction ]          ║");
  console.log("╚══════════════════════════════════════════════╝");
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
      // BUILD POOL FIRST: Check reserves. If pool is dry, only BUY.
      const [r0, r1] = await dex.getReserves();
      const isDry = (r0 < ethers.parseEther("1.0")); // Less than 1 DNR in pool?
      
      const isBuy = isDry || (Math.random() < BUY_CHANCE);

      if (isBuy) {
        // ── GREEN BAR ENGINE 🟢 ───────────────────────────────────────────
        const dnrBal = await provider.getBalance(wallet.address);
        if (dnrBal < ethers.parseEther("10.0")) continue;

        const buyDNR = rand(MIN_DNR, MAX_DNR).toFixed(4);
        const buyValue = ethers.parseEther(buyDNR);
        console.log(`  🏹 🟢 BUY  : Spending ${buyDNR} DNR to grow pool`);

        const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, {
          value: buyValue, gasLimit: GAS_LIMIT, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Pool: ${fmt(r0)} DNR / ${fmt(r1)} ktUSD`);

      } else {
        // ── MICRO SELL ENGINE 🔴 (Safety Optimized) ───────────────────────
        const ktBal = await dex.balanceOf(wallet.address);
        if (ktBal < ethers.parseEther("10.0")) continue;

        // MICRO SELL: Only sell a tiny amount (0.1 to 0.5 ktUSD) 
        // This creates the "Red Bar" without breaking the pool math.
        const sellAmt = ethers.parseEther(rand(0.1, 0.5).toFixed(4));
        console.log(`  🏹 🔴 MICRO-SELL : Trading ${fmt(sellAmt)} ktUSD for DNR`);

        const allowance = await dex.allowance(wallet.address, PROXY);
        if (allowance < sellAmt) {
          console.log(`     🔓 Approving Proxy...`);
          const appTx = await dex.approve(PROXY, ethers.MaxUint256, { 
            gasPrice: GAS_PRICE, gasLimit: 200000, type: 0 
          });
          await appTx.wait();
        }

        const tx = await proxy.s(sellAmt, {
          gasLimit: 600000, gasPrice: GAS_PRICE, type: 0
        });
        await tx.wait();
        console.log(`     ✅ Success! Organic flow achieved.`);
      }

    } catch (err) {
      console.error(`  ⚠ Cycle Pause: ${err.message?.slice(0, 100)}`);
      await sleep(10000);
    }
  }
}

main().catch(console.error);
