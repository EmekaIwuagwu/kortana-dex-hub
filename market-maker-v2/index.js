const { ethers } = require("ethers");
require("dotenv").config();

// KORTANA MONODEX MAINNET CONFIG
const RPC_URL = process.env.RPC_URL || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEX_ADDRESS = ethers.getAddress("0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45".toLowerCase());

const MIN_DELAY = 180000; // 3 mins
const MAX_DELAY = 900000; // 15 mins

async function runBot() {
    if (!PRIVATE_KEY) {
        console.error("FATAL: PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    const dexAbi = [
        "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
        "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX_ADDRESS, dexAbi, wallet);

    console.log("🦁 KORTANA SOVEREIGN-SOLID HEARTBEAT v2.3");
    console.log(`📡 Wallet: ${wallet.address}`);

    // Anti-Sleep Server
    const http = require("http");
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end("SOVEREIGN_HEARTBEAT_HEALTHY");
    }).listen(process.env.PORT || 10000);

    while (true) {
        try {
            const isBuy = Math.random() > 0.40; // 60% Buy bias for healthy chart growth
            
            if (isBuy) {
                const buyAmount = (Math.random() * 4 + 1).toFixed(4); // 1-5 DNR
                console.log(`🏹 Buying ${buyAmount} DNR...`);
                const tx = await dex.swapExactDNRForKTUSD(0, wallet.address, { 
                    value: ethers.parseEther(buyAmount)
                });
                const receipt = await tx.wait();
                console.log(`✅ Buy Success: ${receipt.hash}`);
            } else {
                const balance = await dex.balanceOf(wallet.address);
                if (balance > ethers.parseEther("51")) {
                    console.log(`⚓ Selling 50.0 ktUSD (Safe-Sized Burst)...`);
                    const tx = await dex.swapExactKTUSDForDNR(
                        ethers.parseEther("50.0"), 
                        0, 
                        wallet.address,
                        { gasLimit: 5000000 } // Ample gas for rebase math
                    );
                    const receipt = await tx.wait();
                    console.log(`✅ Sell Success: ${receipt.hash}`);
                } else {
                    console.log("⏳ Waiting for ktUSD balance to accumulate...");
                }
            }
        } catch (error) {
            console.error(`❌ Cycle Interrupted: ${error.message}`);
        }

        const nextDelay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);
        console.log(`💤 Sleeping for ${Math.floor(nextDelay/1000)}s...`);
        await new Promise(r => setTimeout(r, nextDelay));
    }
}

runBot();
