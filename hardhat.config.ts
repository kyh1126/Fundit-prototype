import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-viem";
import "@typechain/hardhat";
import "dotenv/config";

const config: HardhatUserConfig = {
  // Solidity 컴파일러 설정
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },

  // 네트워크 설정
  networks: {
    baseSepoliaTestnet: {
      url: "https://sepolia.base.org",
      accounts: process.env.TESTNET_PRIVATE_KEY ? [process.env.TESTNET_PRIVATE_KEY] : [],
      chainId: 84532,
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },

  // TypeChain 설정
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  // 경로 설정
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
