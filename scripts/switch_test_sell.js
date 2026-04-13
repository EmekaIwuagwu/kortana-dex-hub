const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    const RPC_URL = "https://zeus-rpc.mainnet.kortana.xyz";
    const DEX = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
    
    const wallets = JSON.parse(fs.readFileSync("TRADER_WALLETS.json", "utf8"));
    const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
    
    // Wallet 1 (Trader)
    const wallet1 = new ethers.Wallet(wallets[0].privateKey, provider);
    // Wallet 2 (Recipient of DNR)
    const wallet2 = new ethers.Wallet(wallets[1].privateKey, provider);

    const abi = [
        "function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external",
        "function balanceOf(address) external view returns (uint256)"
    ];

    const dex = new ethers.Contract(DEX, abi, wallet1);

    console.log("🕵️‍♂️ TESTING THE 'SWITCH' SELL...");
    console.log("   Sender:  ", wallet1.address);
    console.log("   Receiver:", wallet2.address);

    const ktBal = await dex.balanceOf(wallet1.address);
    console.log("💰 Sender ktUSD Balance:", ethers.formatUnits(ktBal, 18));
    
    if (ktBal === 0n) {
       console.log("❌ Sender has no ktUSD to sell. Running a quick buy first...");
       const buyTx = await dex.swapExactDNRForKTUSD(0, wallet1.address, {
           value: ethers.parseEther("1.0"), gasLimit: 400000, gasPrice: 3n, type: 0
       });
       await buyTx.wait();
       console.log("✅ Buy complete. Now testing Sell...");
    }

    const testAmt = ethers.parseEther("0.1");

    try {
        console.log("🏹 Selling from W1 -> Receiving DNR in W2...");
        const tx = await dex.swapExactKTUSDForDNR(testAmt, 0, wallet2.address, {
            gasLimit: 800000, 
            gasPrice: 3n,
            type: 0
        });
        console.log("📡 Sent! Hash:", tx.hash);
        const receipt = await tx.wait();
        if (receipt.status === 1) {
            console.log("✅ SUCCESS! The 'Switch' method worked perfectly. This IS the fix.");
        } else {
            console.log("❌ REVERTED.");
        }
    } catch (e) {
        console.error("❌ FAILED:", e.message);
    }
}

main();
