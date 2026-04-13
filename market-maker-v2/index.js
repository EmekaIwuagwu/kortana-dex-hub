const { ethers } = require("ethers");
require("dotenv").config();

// KORTANA MONODEX MAINNET CONFIG
const RPC_URL = process.env.RPC_URL || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Official Mainnet Addresses
const DEX_ADDRESS = ethers.getAddress("0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45".toLowerCase());
const WDNR_ADDRESS = ethers.getAddress("0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3".toLowerCase());

// Trading Settings
const MIN_DELAY = 120000; // 2 minutes
const MAX_DELAY = 600000; // 10 minutes
const MIN_TRADE = "0.50"; 
const MAX_TRADE = "5.00";

async function runBot() {
    if (!PRIVATE_KEY) {
        console.error("FATAL: PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // MonoDEX ABI (Matching your frontend)
    const dexAbi = [
        "function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable",
        "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external",
        "function balanceOf(address account) external view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    const dex = new ethers.Contract(DEX_ADDRESS, dexAbi, wallet);

    console.log("🦁 KORTANA MONO-HEARTBEAT ACTIVATED");
    console.log(`📡 Wallet: ${wallet.address}`);

    // Health Check Server
    const http = require("http");
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end("MONODEX_HEARTBEAT_HEALTHY");
    }).listen(process.env.PORT || 3000);

    while (true) {
        try {
            const isBuy = Math.random() > 0.45; 
            const amount = (Math.random() * (parseFloat(MAX_TRADE) - parseFloat(MIN_TRADE)) + parseFloat(MIN_TRADE)).toFixed(4);
            const amountInWei = ethers.parseEther(amount);

            if (isBuy) {
                console.log(`🏹 Mono-Buy: ${amount} DNR...`);
                // swapExactDNRForKTUSD(minOut, to)
                const tx = await dex.swapExactDNRForKTUSD(
                    0, 
                    wallet.address, 
                    { value: amountInWei, gasLimit: 500000 }
                );
                await tx.wait();
                console.log(`✅ Buy Success: ${tx.hash}`);
            } else {
                const balance = await dex.balanceOf(wallet.address);
                if (balance > 0n) {
                    console.log(`⚓ Mono-Sell: ktUSD balance detected...`);
                    // Randomize sell amount
                    const sellAmount = balance / 3n; // Sell 33% of ktUSD balance
                    if (sellAmount > 1000000000000000n) { // Min 0.001 ktUSD
                        console.log(`⚓ Selling ${ethers.formatEther(sellAmount)} ktUSD...`);
                        const tx = await dex.swapExactKTUSDForDNR(
                            sellAmount,
                            0,
                            wallet.address,
                            { gasLimit: 500000 }
                        );
                        await tx.wait();
                        console.log(`✅ Sell Success: ${tx.hash}`);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Trade Failed: ${error.message}`);
            if (error.reason) console.error(`Reason: ${error.reason}`);
            console.log("Retrying in 30s...");
            await new Promise(r => setTimeout(r, 30000));
        }

        const nextDelay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY);
        console.log(`💤 Sleeping for ${Math.floor(nextDelay/1000)}s...`);
        await new Promise(r => setTimeout(r, nextDelay));
    }
}

runBot();
