const ContractManager = require("./ContractManager");
const { ethers } = require("ethers");

require("dotenv").config();

const main = async () => {
  const CA = "0xaF30C3c1485232d5876707cEf7bB930F0e7a89d2";
  const TOKEN_CA = "0x..."; // Replace with actual token contract address

  const manager = new ContractManager(CA, TOKEN_CA);
  
  // Submit a claim
  await manager.submitClaim(
    1, // Contract ID
    "Medical expenses for emergency surgery", // Description
    ethers.parseEther("0.5") // Amount (0.5 ETH)
  );
  
  // Process the claim (in a real implementation, this would be done by the oracle)
  // For this example, we'll use a dummy request ID
  const dummyRequestId = ethers.ZeroHash;
  await manager.processClaim(1, dummyRequestId);
};

main(); 