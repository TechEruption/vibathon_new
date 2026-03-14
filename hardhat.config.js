require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { AVALANCHE_FUJI_RPC_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    fuji: {
      url: AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY.trim()] : []
    }
  }
};
