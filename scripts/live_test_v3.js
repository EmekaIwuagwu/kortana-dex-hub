const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    const PROXY = "0x1C0904BEdC886F179cbDEFd18a5d2393F85CD535"; // V3
    
    const wallets = JSON.parse(require("fs").readFileSync("TRADER_WALLETS.json", "utf8"));
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    const wallet = new ethers.Wallet(wallets[0].privateKey, provider);

    const abi = [
        "function s(uint256 amount) external",
        "function approve(address, uint256) external returns (bool)",
        "function allowance(address, address) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet);
    const proxy = new ethers.Contract(PROXY, abi, wallet);

    console.log("🚀 LIVE TEST: Proxy V3 (Non-EOA recipient)");

    const amt = ethers.parseEther("0.1");
    
    console.log("🔓 Checking Allowance...");
    const allowance = await dex.allowance(wallet.address, PROXY);
    if (allowance < amt) {
        console.log("✍️ Approving Proxy V3...");
        const tx = await dex.approve(PROXY, ethers.MaxUint256, { gasPrice: 3n, gasLimit: 200000 });
        await tx.wait();
    }

    console.log("🏹 Executing Sell via V3...");
    try {
        const tx = await proxy.s(amt, {
            gasLimit: 800000,
            gasPrice: 3n,
            type: 0
        });
        console.log("📡 Transaction Sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅✅✅ SUCCESS! THE V3 PROXY WORKED! ✅✅✅");
        } else {
            console.log("❌ REVERTED AGAIN. (Wait, check the gas used)");
        }
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
}

main();
