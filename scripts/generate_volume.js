const { ethers } = require("hardhat");

/**
 * Kortana Market Maker V1
 * Purpose: Generate $150k+ organic volume for DEXScreener Approval.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const dexAddr = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  const DEX = await ethers.getContractAt("KortanaMonoDEX", dexAddr);

  console.log("\n👑 KORTANA MARKET MAKER ACTIVE");
  console.log("--------------------------------");
  console.log("Operator:", deployer.address);
  console.log("Target Volume: $1,000,000 (Maintenance Mode)");

  let totalVolumeUSD = 304778; // Starting from current live total
  let txCount = 0;

  while (true) {
    txCount++;
    const isBuy = Math.random() > 0.4; // 60% Buy, 40% Sell for realistic flow
    const dnrAmount = (Math.random() * 6 + 1).toFixed(4); // $385 - $2,700 trades
    const amountWei = ethers.parseEther(dnrAmount);
    const usdValue = Number(dnrAmount) * 385;

    try {
      if (isBuy) {
        process.stdout.write(`[TX #${txCount}] Organic Buy: ${dnrAmount} DNR ($${usdValue.toFixed(2)})... `);
        const tx = await DEX.swapExactDNRForKTUSD(0, deployer.address, {
          value: amountWei,
          gasLimit: 500000
        });
        await tx.wait();
        process.stdout.write(`✅\n`);
      } else {
        const ktusdToSell = (Math.random() * 800 + 200).toFixed(0);
        const ktusdWei = ethers.parseUnits(ktusdToSell, 18);

        process.stdout.write(`[TX #${txCount}] Organic Sell: ${ktusdToSell} ktUSD ($${ktusdToSell})... `);

        const tx = await DEX.swapExactKTUSDForDNR(ktusdWei, 0, deployer.address, {
          gasLimit: 500000
        });
        await tx.wait();
        process.stdout.write(`✅\n`);
        totalVolumeUSD += Number(ktusdToSell);
      }

      if (isBuy) totalVolumeUSD += usdValue;
      console.log(`📊 Cumulative Volume: $${totalVolumeUSD.toLocaleString()}`);

      if (totalVolumeUSD >= 1000000) {
        console.log("\n🎯 MAINTENANCE COMPLETE.");
        break;
      }

      // Slightly longer delay for organic afternoon feel: 10-25 seconds
      const delay = Math.floor(Math.random() * 15000) + 10000;
      await new Promise(r => setTimeout(r, delay));

    } catch (e) {
      console.log(`❌ Skipped (Likely Balance/Gas): ${e.message.substring(0, 50)}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(console.error);
