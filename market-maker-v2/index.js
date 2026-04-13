const { ethers } = require("ethers");
require("dotenv").config();

// CONFIGURATION
const RPC_URL = process.env.RPC_URL || "https://zeus-rpc.mainnet.kortana.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PAIR_ADDRESS = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
const ROUTER_ADDRESS = "0xDEE4B2beBA0f0b40Ff70C579c8dD8b0fA9A060C3";
const ktUSD_ADDRESS = "0xB2Bc15d9d9Ce9FbD85Df647D4C945514751D111e";
const WDNR_ADDRESS = "0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3";

// Trading Settings
const MIN_DELAY = 120000; // 2 minutes
const MAX_DELAY = 600000; // 10 minutes
const MIN_TRADE = "1.00"; 
const MAX_TRADE = "10.00";

async function runBot() {
    if (!PRIVATE_KEY) {
        console.error("FATAL: PRIVATE_KEY missing in .env");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // ABIs
    const routerAbi = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    ];
    const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, wallet);
    const ktUSD = new ethers.Contract(ktUSD_ADDRESS, erc20Abi, wallet);

    console.log("🦁 KORTANA HEARTBEAT ACTIVATED");
    console.log(`📡 Wallet: ${wallet.address}`);

    while (true) {
        try {
            const isBuy = Math.random() > 0.45; // 55% Buy, 45% Sell for gradual growth
            const amount = (Math.random() * (parseFloat(MAX_TRADE) - parseFloat(MIN_TRADE)) + parseFloat(MIN_TRADE)).toFixed(4);
            const amountInWei = ethers.parseEther(amount);

            if (isBuy) {
                console.log(`🏹 Buying: ${amount} DNR...`);
                const tx = await router.swapExactETHForTokens(
                    0, 
                    [WDNR_ADDRESS, ktUSD_ADDRESS], 
                    wallet.address, 
                    Math.floor(Date.now() / 1000) + 600,
                    { value: amountInWei }
                );
                await tx.wait();
                console.log(`✅ Buy Success: ${tx.hash}`);
            } else {
                const balance = await ktUSD.balanceOf(wallet.address);
                if (balance > 0n) {
                    console.log(`⚓ Selling: ${amount} ktUSD...`);
                    // Randomize sell amount based on balance
                    const sellAmount = balance / 2n > amountInWei ? amountInWei : balance;
                    
                    await ktUSD.approve(ROUTER_ADDRESS, sellAmount);
                    const tx = await router.swapExactTokensForETH(
                        sellAmount,
                        0,
                        [ktUSD_ADDRESS, WDNR_ADDRESS],
                        wallet.address,
                        Math.floor(Date.now() / 1000) + 600
                    );
                    await tx.wait();
                    console.log(`✅ Sell Success: ${tx.hash}`);
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
