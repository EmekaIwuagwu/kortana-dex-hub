const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    
    const key = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(key, provider);

    const abi = [
        "function transfer(address to, uint256 value) external returns (bool)",
        "function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external",
        "function getReserves() external view returns (uint112, uint112, uint32)",
        "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);

    console.log("🦄 UNISWAP-STYLE SELL TEST");

    const [r0, r1] = await dex.getReserves();
    const testAmt = ethers.parseEther("0.1");
    
    // Calculate how much DNR we should get back
    const amountOut = await dex.getAmountOut(testAmt, r1, r0);
    console.log(`📊 Expected Out: ${ethers.formatEther(amountOut)} DNR`);

    try {
        console.log("1️⃣ Step 1: Transferring ktUSD to DEX...");
        const tTx = await dex.transfer(DEX, testAmt, { gasPrice: 3n, gasLimit: 200000, type: 0 });
        await tTx.wait();
        console.log("   ✅ Transfer confirmed.");

        console.log("2️⃣ Step 2: Calling swap()...");
        const sTx = await dex.swap(amountOut, 0, wallet.address, "0x", {
            gasPrice: 3n,
            gasLimit: 300000,
            type: 0
        });
        const receipt = await sTx.wait();
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! The Uniswap-style sell worked perfectly.");
        } else {
            console.log("❌ Swap Reverted.");
        }
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
}

main();
