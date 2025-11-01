require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    celoSepolia: {
      url: "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts: {
        mnemonic: process.env.MNEMONIC || ""
      }
    },
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: {
        mnemonic: process.env.MNEMONIC || ""
      }
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  }
};
