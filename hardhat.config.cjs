require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 10 },
      evmVersion: "london",   // MANDATORY — no Cancun opcodes (Bug 3 fix)
    },
  },
  networks: {
    kortanaTestnet: {
      url: "https://poseidon-rpc.testnet.kortana.xyz/",
      chainId: 72511,
      accounts: privateKey ? [privateKey] : [],
      gasPrice: 1,      // force legacy type-0 tx
    },
    kortanaMainnet: {
      url: process.env.MAINNET_RPC || "https://zeus-rpc.mainnet.kortana.xyz",
      chainId: 9002,
      accounts: privateKey ? [privateKey] : [],
      gasPrice: 1,
    },
  },
};
