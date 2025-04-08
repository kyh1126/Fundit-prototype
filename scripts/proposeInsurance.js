const ContractManager = require("./ContractManager");
const { ethers } = require("ethers");

require("dotenv").config();

const main = async () => {
  const CA = "0xaF30C3c1485232d5876707cEf7bB930F0e7a89d2";

  const manager = new ContractManager(CA);
  await manager.getOwner();
  await manager.proposeInsurance(
    "Basic Health Insurance",
    "Comprehensive health insurance coverage",
    ethers.parseEther("0.1"),  // 0.1 ETH premium
    ethers.parseEther("1"),    // 1 ETH coverage
    30 * 24 * 60 * 60         // 30 days duration
  );
};

main(); 