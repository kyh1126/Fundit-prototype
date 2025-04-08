import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import "@typechain/hardhat";
import "dotenv/config";

const config: HardhatUserConfig = {
  // Solidity 컴파일러 설정
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  // 네트워크 설정
  networks: {
    baseSepoliaTestnet: {
      url: "https://sepolia.base.org",
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },

  // TypeChain 설정
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
