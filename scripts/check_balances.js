const { ethers } = require("ethers");
const fs = require("fs");

/**
 * 🕵️‍♂️ Wallet Audit Script
 * Checks the DNR balance of all 14 wallets.
 */
async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    
    // Load the 14 wallets we generated
    const wallets = JSON.parse(fs.readFileSync("TRADER_WALLETS.json", "utf8"));

    console.log("╔══════════════════════════════════════════════╗");
    console.log("║         KORTANA WALLET BALANCE AUDIT         ║");
    console.log("╚══════════════════════════════════════════════╝\n");

    for (const w of wallets) {
        const bal = await provider.getBalance(w.address);
        const balEth = ethers.formatEther(bal);
        const status = parseFloat(balEth) > 0 ? "✅ FUNDED" : "❌ EMPTY";
        
        console.log(`[${w.id}] ${w.address}: ${parseFloat(balEth).toFixed(2)} DNR [${status}]`);
    }
}

main().catch(console.error);
