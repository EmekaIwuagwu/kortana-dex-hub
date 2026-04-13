const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    const PROXY = "0x1D0E141610784A3f9350ac1FF7ca1b307b933f6A";
    
    // Using one of the funded 14 wallets from Render variable
    const key = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(key, provider);

    const abi = [
        "function balanceOf(address) external view returns (uint256)",
        "function s(uint256 amount) external",
        "function approve(address, uint256) external returns (bool)",
        "function allowance(address, address) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);
    const proxy = new ethers.Contract(PROXY, abi, wallet);

    console.log("🚀 LIVE TEST: Micro-Sell (0.1 ktUSD)");

    const amt = ethers.parseEther("0.1"); // TINY AMOUNT
    
    // Check it
    console.log("🔓 Checking Allowance...");
    const allowance = await dex.allowance(wallet.address, PROXY);
    if (allowance < amt) {
        console.log("✍️ Approving Proxy...");
        const tx = await dex.approve(PROXY, ethers.MaxUint256, { gasPrice: 3n, gasLimit: 200000, type: 0 });
        await tx.wait();
    }

    console.log("🏹 Executing Micro-Sell...");
    try {
        const tx = await proxy.s(amt, {
            gasLimit: 600000,
            gasPrice: 3n,
            type: 0
        });
        console.log("📡 Transaction Sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! The Organic Sell worked.");
        } else {
            console.log("❌ REVERTED ON-CHAIN.");
        }
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
}

main();
