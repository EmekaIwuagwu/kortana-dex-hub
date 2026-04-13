const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Sending from:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", hre.ethers.formatEther(balance));

    const to = "0xf251038d1dB96Ce1a733Ae92247E0A6F400F275E";
    const amount = hre.ethers.parseEther("12000000");

    console.log(`Sending 12,000,000 DNR down to ${to}...`);

    const tx = await deployer.sendTransaction({
        to: to,
        value: amount,
        gasPrice: 1, // ensure type-0
        type: 0
    });

    console.log("Tx hash:", tx.hash);
    await tx.wait();
    console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
