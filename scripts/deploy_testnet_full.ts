import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying full Modular Suite with account:", deployer.address);

  // 1. Deploy WDNR (Wrapper)
  console.log("Deploying WDNR...");
  const WDNR = await ethers.deployContract("WDNR", [], {
     gasLimit: 3000000,
     type: 0 // Legacy
  });
  await WDNR.waitForDeployment();
  const wdnrAddr = await WDNR.getAddress();
  console.log("✅ WDNR:", wdnrAddr);

  // 1a. Deploy KLP (Liquidity Provider Token)
  console.log("Deploying KLP...");
  const KLP = await ethers.deployContract("KLP", [], { gasLimit: 2000000, type: 0 });
  await KLP.waitForDeployment();
  const klpAddr = await KLP.getAddress();
  console.log("✅ KLP Token:", klpAddr);

  // 2. Deploy KortanaMonoDEX (Algo Brain + Stablecoin + Native Pool)
  console.log("Deploying KortanaMonoDEX...");
  const mintCap = ethers.parseEther("1000000"); // 1M ktUSD daily cap
  const minCollRatio = 150; // 150%
  const MonoDEX = await ethers.deployContract("KortanaMonoDEX", [deployer.address, wdnrAddr, klpAddr, mintCap, minCollRatio], {
     gasLimit: 8000000,
     type: 0
  });
  await MonoDEX.waitForDeployment();
  const monoAddr = await MonoDEX.getAddress();
  console.log("✅ MonoDEX (ktUSD):", monoAddr);

  // 2a. Transfer KLP Ownership to MonoDEX
  console.log("Transferring KLP ownership to MonoDEX...");
  const ownTx = await KLP.transferOwnership(monoAddr, { gasLimit: 500000, type: 0 });
  await ownTx.wait();
  console.log("✅ KLP now controlled by MonoDEX.");

  // 3. Deploy KortanaFactory (Modular Pool Factory)
  console.log("Deploying KortanaFactory...");
  const Factory = await ethers.deployContract("KortanaFactory", [deployer.address], {
     gasLimit: 4000000,
     type: 0
  });
  await Factory.waitForDeployment();
  const factoryAddr = await Factory.getAddress();
  console.log("✅ Factory:", factoryAddr);

  // 4. Deploy KortanaRouter (Modular Routing)
  console.log("Deploying KortanaRouter...");
  const Router = await ethers.deployContract("KortanaRouter", [factoryAddr, wdnrAddr], {
     gasLimit: 4000000,
     type: 0
  });
  await Router.waitForDeployment();
  const routerAddr = await Router.getAddress();
  console.log("✅ Router:", routerAddr);

  // 5. Deploy KortanaFarm (The Yield Multiplier)
  console.log("Deploying KortanaFarm...");
  // 0.1 DNR per second as rewards
  const rewardRate = ethers.parseEther("0.1");
  const Farm = await ethers.deployContract("KortanaFarm", [rewardRate], {
     gasLimit: 4000000,
     type: 0
  });
  await Farm.waitForDeployment();
  const farmAddr = await Farm.getAddress();
  console.log("✅ Farm:", farmAddr);

  // 6. Deploy BridgedUSDT (kUSDT)
  console.log("Deploying BridgedUSDT (kUSDT)...");
  const kUSDT = await ethers.deployContract("BridgedUSDT", [], {
     gasLimit: 4000000,
     type: 0
  });
  await kUSDT.waitForDeployment();
  const kusdtAddr = await kUSDT.getAddress();
  console.log("✅ kUSDT:", kusdtAddr);

  // ---------------------------------------------------------------------------
  // 6. INITIAL SEEDING (The $312 Oracle Initiation)
  // ---------------------------------------------------------------------------
  console.log("\n🧪 Initializing Economic Seeds...");
  
  // Seed 1,000 DNR and 312,000 ktUSD into the MonoDEX native pool
  const seedDNR = ethers.parseEther("1000");
  const seedKTUSD = ethers.parseEther("312000");

  console.log("Minting initial ktUSD for seeding...");
  const mintTx = await MonoDEX.mint(deployer.address, seedKTUSD, { gasLimit: 500000, type: 0 });
  await mintTx.wait();

  console.log("Approving ktUSD for pool seeding...");
  const appTx = await MonoDEX.approve(monoAddr, seedKTUSD, { gasLimit: 500000, type: 0 });
  await appTx.wait();

  console.log("Seeding Native DNR/ktUSD pool...");
  const tx = await MonoDEX.addLiquidity(seedKTUSD, 0, 0, deployer.address, { 
    value: seedDNR,
    gasLimit: 1000000,
    type: 0 
  });
  await tx.wait();
  console.log("✅ Pool Seeded! Exchange rate set: 1 DNR = 312 ktUSD");

  // Transfer 10,000 DNR to the Farm for initial rewards
  console.log("Funding Farm with 10,000 DNR rewards...");
  const fundTx = await deployer.sendTransaction({
    to: farmAddr,
    value: ethers.parseEther("10000"),
    gasLimit: 100000,
    type: 0
  });
  await fundTx.wait();
  console.log("✅ Farm Funded!");

  // 8. Whitelist the LP token in the Farm
  console.log("Adding KLP pool to Farm...");
  const addTx = await Farm.addPool(100, klpAddr, true, { gasLimit: 500000, type: 0 });
  await addTx.wait();
  console.log("✅ KLP Pool active in Farm.");

  console.log("\n✨ FULL MODULAR SUITE DEPLOYED TO TESTNET ✨");
  console.log("----------------------------------------------");
  console.log(`WDNR:    ${wdnrAddr}`);
  console.log(`MONODEX: ${monoAddr}`);
  console.log(`FACTORY: ${factoryAddr}`);
  console.log(`ROUTER:  ${routerAddr}`);
  console.log(`FARM:    ${farmAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
