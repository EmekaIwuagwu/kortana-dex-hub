const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

/**
 * 💰 Kortana DNR Dispenser
 * Automatically funds your 14 trader wallets from the master account.
 */
async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    // NOTE: Multi-wallet setup uses comma-separated keys. 
    // We take the FIRST one as the master for funding.
    const MASTER_KEY = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    
    if (!MASTER_KEY) {
        console.error("❌ No PRIVATE_KEY found in .env");
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const master = new ethers.Wallet(MASTER_KEY, provider);

    console.log(`📡 Master Wallet: ${master.address}`);
    const balance = await provider.getBalance(master.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} DNR\n`);

    const wallets = JSON.parse(fs.readFileSync("TRADER_WALLETS.json", "utf8"));
    const AMOUNT_TO_SEND = ethers.parseEther("50.0"); // 50 DNR per wallet

    console.log(`🚀 Starting distribution to ${wallets.length} wallets...\n`);

    for (const trader of wallets) {
        try {
            console.log(`🏹 Sending 50 DNR to ${trader.address}...`);
            const tx = await master.sendTransaction({
                to: trader.address,
                value: AMOUNT_TO_SEND,
                gasPrice: 3n, // Fixed Kortana gas price
                gasLimit: 21000,
                type: 0
            });
            console.log(`   ✅ Sent! Hash: ${tx.hash.slice(0, 20)}...`);
            // Wait a moment for the chain to breathe
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log("\n✨ All wallets funded! They are ready to trade.");
}

main().catch(console.error);
