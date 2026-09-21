require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    // local test blockchain (hardhat node run pannina apparam use pannalam)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Polygon Mumbai/Amoy testnet mela deploy panna venumna idha use pannunga
    // amoy: {
    //   url: process.env.RPC_URL,
    //   accounts: [process.env.PRIVATE_KEY],
    // },
  },
};
