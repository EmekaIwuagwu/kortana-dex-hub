const { ethers } = require("ethers");
const fs = require("fs");

/**
 * 🎫 Kortana Wallet Generator
 * Run this once to create your 14 "Organic Traders"
 */
function main() {
    console.log("╔══════════════════════════════════════╗");
    console.log("║    GENERATING 14 TRADER WALLETS     ║");
    console.log("╚══════════════════════════════════════╝\n");

    const wallets = [];
    const keysOnly = [];

    for (let i = 1; i <= 14; i++) {
        const wallet = ethers.Wallet.createRandom();
        wallets.push({
            id: i,
            address: wallet.address,
            privateKey: wallet.privateKey
        });
        keysOnly.push(wallet.privateKey);
        console.log(`[${i}] ${wallet.address}`);
    }

    // Save to a file so you don't lose them!
    const data = JSON.stringify(wallets, null, 2);
    fs.writeFileSync("TRADER_WALLETS.json", data);

    console.log("\n✅ Done! Saved details to TRADER_WALLETS.json");
    console.log("\n👇 COPY THIS LINE FOR RENDER (PRIVATE_KEY variable):");
    console.log("──────────────────────────────────────────────────");
    console.log(keysOnly.join(","));
    console.log("──────────────────────────────────────────────────");
}

main();
