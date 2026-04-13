const { ethers } = require("ethers");
require("dotenv").config();

/**
 * 🕵️‍♂️ TRANSACTION ANATOMIZER
 * Forces a sell and catches the EXACT revert trace.
 */
async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    const PROXY = "0x1D0E141610784A3f9350ac1FF7ca1b307b933f6A";
    
    // Pick the first scout wallet
    const key = (process.env.PRIVATE_KEY || "").split(",")[0].trim();
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(key, provider);

    const abi = [
        "function balanceOf(address) external view returns (uint256)",
        "function approve(address, uint256) external returns (bool)",
        "function allowance(address, address) external view returns (uint256)",
        "function s(uint256 amount) external"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);
    const proxy = new ethers.Contract(PROXY, abi, wallet);

    console.log("🕵️‍♂️ Starting Deep Diagnostic for Wallet:", wallet.address);

    const ktBal = await dex.balanceOf(wallet.address);
    console.log("💰 ktUSD Balance:", ethers.formatEther(ktBal));

    if (ktBal === 0n) {
        console.error("❌ Need ktUSD to test sell!");
        return;
    }

    const testAmt = ktBal / 100n; // Test with 1%
    console.log("🧪 Testing SELL for:", ethers.formatEther(testAmt), "ktUSD");

    // 1. Check Allowance
    const allowance = await dex.allowance(wallet.address, PROXY);
    console.log("🔓 Proxy Allowance:", ethers.formatEther(allowance));

    if (allowance < testAmt) {
        console.log("✍️ Approving Proxy...");
        const tx = await dex.approve(PROXY, ethers.MaxUint256, { gasPrice: 3n, gasLimit: 200000 });
        await tx.wait();
        console.log("✅ Approved.");
    }

    // 2. SIMULATE THE CALL
    console.log("📡 Simulating Proxy.s(amount)...");
    try {
        // We use callStatic to get the revert reason without spending gas
        await proxy.s.staticCall(testAmt);
        console.log("✅ Simulation SUCCEEDED! (This is strange if it reverts on-chain)");
    } catch (err) {
        console.log("❌ Simulation FAILED.");
        console.log("------------------------------------------");
        console.log("REASON:", err.reason || "No reason given");
        console.log("CODE:", err.code);
        if (err.data) {
            console.log("DATA:", err.data);
            // Try to decode if possible
        }
        console.log("------------------------------------------");
    }

    // 3. TRY RAW CALL (To check gas/RLP issues)
    const data = proxy.interface.encodeFunctionData("s", [testAmt]);
    console.log("📦 Raw Calldata Length:", data.length / 2 - 1, "bytes");
    
    try {
        const estimate = await provider.estimateGas({
            from: wallet.address,
            to: PROXY,
            data: data
        });
        console.log("⛽ Estimated Gas:", estimate.toString());
    } catch (e) {
        console.log("⛽ Gas Estimation Failed:", e.message.slice(0, 100));
    }
}

main().catch(console.error);
