const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    
    // Test with the funded scout wallet
    const key = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(key, provider);

    const abi = [
        "function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external",
        "function balanceOf(address) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);

    console.log("🔭 DIRECT SELL TEST (NO PROXY)");
    const ktBal = await dex.balanceOf(wallet.address);
    console.log("💰 ktUSD Balance:", ethers.formatEther(ktBal));

    if (ktBal === 0n) {
        console.error("❌ Need ktUSD!");
        return;
    }

    const testAmt = ethers.parseEther("0.1"); // Tiny test

    try {
        console.log("🏹 Sending DIRECT SELL (191 bytes RLP)...");
        const tx = await dex.swapExactKTUSDForDNR(testAmt, 0, wallet.address, {
            gasLimit: 800000, 
            gasPrice: 3n,
            type: 0
        });
        console.log("📡 Transaction BROADCASTED! Hash:", tx.hash);
        console.log("Waiting for receipt...");
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! Direct Sell works. The Proxy was unnecessary.");
        } else {
            console.log("❌ REVERTED ON-CHAIN.");
        }
    } catch (e) {
        console.log("❌ BROADCAST FAILED.");
        console.log("ERROR:", e.message);
    }
}

main();
