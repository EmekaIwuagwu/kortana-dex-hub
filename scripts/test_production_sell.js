const { ethers } = require("ethers");

async function test() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const PRIV_KEY = "0xd48debcbd5d3ef2616558828ea0b4a74094825c4f55beffd27ce1af248c70033"; // Scout Wallet
    const DEX_ADDR = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const abi = [
        "function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX_ADDR, abi, wallet);
    const bal = await dex.balanceOf(wallet.address);
    console.log("Current ktUSD Balance:", ethers.formatEther(bal));

    if (bal > 0n) {
        const sellAmount = bal / 100n; // Sell 1% for test
        console.log(`TEST: Attempting to sell ${ethers.formatEther(sellAmount)} ktUSD...`);
        try {
            const tx = await dex.swapExactKTUSDForDNR(sellAmount, 0, wallet.address, { gasLimit: 3000000 });
            console.log("TX SENT:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ TEST SUCCESS! STATUS:", receipt.status);
        } catch (e) {
            console.error("❌ TEST FAILED:", e.message);
        }
    } else {
        console.log("No balance to test sell.");
    }
}

test();
