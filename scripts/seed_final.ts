import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const monoAddr = "0x0AFdAcD509e73115EA1654B1a770f1a807e7c9C0";
  const wdnrAddr = "0x55cb3b67D9E65F0Cf4eABCAC84564a1bE6E3b06A";
  const klpAddr  = "0x7290f72B5C67052DDE8e6E179F7803c493e90d3f";

  const MonoDEX = await ethers.getContractAt("KortanaMonoDEX", monoAddr);
  
  console.log("Checking balances...");
  const dnrBal = await ethers.provider.getBalance(deployer.address);
  console.log("DNR Balance:", ethers.formatEther(dnrBal));

  const amountKTUSD18 = ethers.parseEther("312000");
  const amountDNR18   = ethers.parseEther("1000");

  console.log("Minting ktUSD...");
  await (await MonoDEX.mint(deployer.address, amountKTUSD18, { gasLimit: 500000, type: 0 })).wait();

  console.log("Approving ktUSD...");
  await (await MonoDEX.approve(monoAddr, amountKTUSD18, { gasLimit: 500000, type: 0 })).wait();

  console.log("Adding Liquidity (1,000 DNR + 312,000 ktUSD)...");
  try {
    const tx = await MonoDEX.addLiquidity(
      amountKTUSD18, 
      0, 
      0, 
      deployer.address, 
      { 
        value: amountDNR18, 
        gasLimit: 2000000, 
        type: 0 
      }
    );
    await tx.wait();
    console.log("✅ Liquidity Added Successfully!");
  } catch (e) {
    console.error("❌ Add Liquidity Failed!");
    console.error(e);
  }
}

main().catch(console.error);
