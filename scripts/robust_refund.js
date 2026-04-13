const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const MASTER_KEY = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const master = new ethers.Wallet(MASTER_KEY, provider);

    const wallets = JSON.parse(fs.readFileSync("TRADER_WALLETS.json", "utf8"));
    const AMT = ethers.parseEther("50.0");

    console.log("Starting Robust Refunder...");
    
    let nonce = await provider.getTransactionCount(master.address);

    for (const w of wallets) {
        const bal = await provider.getBalance(w.address);
        if (bal >= AMT) {
            console.log(`Address ${w.address} already has funds.`);
            continue;
        }

        console.log(`Sending 50 DNR to ${w.address} (Nonce: ${nonce})...`);
        try {
            const tx = await master.sendTransaction({
                to: w.address,
                value: AMT,
                gasPrice: 3n,
                gasLimit: 21000,
                nonce: nonce++,
                type: 0
            });
            await tx.wait(1); 
            console.log("Confirmed.");
        } catch (e) {
            console.error("Error:", e.message.slice(0, 100));
            nonce = await provider.getTransactionCount(master.address);
        }
    }
    console.log("All wallets verified and funded.");
}
main();
