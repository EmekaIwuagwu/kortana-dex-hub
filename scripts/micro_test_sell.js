const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    
    const key = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(key, provider);

    const abi = [
        "function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external",
        "function balanceOf(address) external view returns (uint256)",
        "function getAmountOut(uint256, bool) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);

    console.log("🔬 MICRO-DIRECT-SELL TEST");

    const testAmt = ethers.parseUnits("0.0001", 18);
    
    try {
        const out = await dex.getAmountOut(testAmt, false);
        console.log(`📊 Expected Out: ${ethers.formatUnits(out, 18)} DNR`);

        console.log("🏹 Sending Micro-Sell (1.5M Gas Limit)...");
        const tx = await dex.swapExactKTUSDForDNR(testAmt, 0, wallet.address, {
            gasLimit: 1500000, 
            gasPrice: 3n,
            type: 0
        });
        console.log("📡 Sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! Micro-Sell worked with high gas.");
        } else {
            console.log("❌ REVERTED.");
        }
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
}

main();
