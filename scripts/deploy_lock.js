const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const dexAddr = "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45";
  const DEX = await ethers.getContractAt("KortanaMonoDEX", dexAddr);

  console.log("🛠️ Deploying LP Lock for 6 months...");
  const lockDuration = 15768000; // 6 months in seconds
  
  const Lock = await ethers.getContractFactory("KortanaLpLock");
  const lock = await Lock.deploy(dexAddr, lockDuration, {
    gasLimit: 3000000,
    gasPrice: 1
  });
  await lock.waitForDeployment();
  const lockAddr = await lock.getAddress();
  
  console.log("✅ Lock Contract deployed at:", lockAddr);

  // Transfer LP from deployer to Lock
  const lpBalance = await DEX.lpBalanceOf(deployer.address);
  console.log("Current Deployer LP Balance:", ethers.formatEther(lpBalance));

  if (lpBalance > 0n) {
      console.log("Locking 100% of LP tokens...");
      const tx = await DEX.lpTransfer(lockAddr, lpBalance, {
          gasLimit: 500000,
          gasPrice: 1
      });
      await tx.wait();
      console.log("🚀 L1 Liquidity is now CRYPTOGRAPHICALLY LOCKED for 6 months!");
  }
}

main().catch(console.error);
