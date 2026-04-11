import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("KortanaMonoDEX", function () {
  async function deployDexFixture() {
    const [owner, operator, user1, user2] = await ethers.getSigners();

    const WDNR = await ethers.getContractFactory("WDNR");
    const wdnr = await WDNR.deploy();

    const DEX = await ethers.getContractFactory("KortanaMonoDEX");
    const mintCap = ethers.parseEther("100000"); 
    const minCollRatio = 150; 
    
    // As per bug fix requirements, we should normally use raw transactions, 
    // but standard hardhat ethers in testing is fine to test internal logic.
    const dex = await DEX.deploy(operator.address, await wdnr.getAddress(), mintCap, minCollRatio);

    return { dex, wdnr, owner, operator, user1, user2 };
  }

  it("Should set the right owner and operator", async function () {
    const { dex, owner, operator } = await loadFixture(deployDexFixture);
    expect(await dex.owner()).to.equal(owner.address);
    expect(await dex.operator()).to.equal(operator.address);
  });

  it("Should allow operator to mint ktUSD (legacy mode)", async function () {
    const { dex, operator, user1 } = await loadFixture(deployDexFixture);
    const mintAmount = ethers.parseEther("100");
    
    await expect(dex.connect(operator).mint(user1.address, mintAmount))
      .to.emit(dex, "Transfer")
      .withArgs(ethers.ZeroAddress, user1.address, mintAmount);

    expect(await dex.balanceOf(user1.address)).to.equal(mintAmount);
  });

  it("Should allow adding liquidity and minting KLP", async function () {
    const { dex, operator, user1 } = await loadFixture(deployDexFixture);
    
    // Mint ktUSD to user1
    const ktUsdAmount = ethers.parseEther("1000");
    await dex.connect(operator).mint(user1.address, ktUsdAmount);

    // Add Liquidity
    const dnrAmount = ethers.parseEther("100"); // 100 DNR
    
    await expect(dex.connect(user1).addLiquidity(
      ktUsdAmount,
      0,
      0,
      user1.address,
      { value: dnrAmount }
    )).to.emit(dex, "Mint");

    const reserves = await dex.getReserves();
    expect(reserves.reserve0).to.equal(dnrAmount);
    expect(reserves.reserve1).to.equal(ktUsdAmount);

    expect(await dex.lpBalanceOf(user1.address)).to.be.gt(0);
  });
});
