const ContractManager = require("./ContractManager");

require("dotenv").config();

const main = async () => {
  const CA = "0xaF30C3c1485232d5876707cEf7bB930F0e7a89d2";
  const TOKEN_CA = "0x..."; // Replace with actual token contract address

  const manager = new ContractManager(CA, TOKEN_CA);
  
  // Submit a review
  await manager.submitReview(
    1, // Contract ID
    "Great insurance experience! The claim process was smooth and the coverage was exactly what I needed. The insurance company was responsive and professional throughout the entire process. I would definitely recommend this service to others.", // Content
    5 // Rating (1-5)
  );
  
  // Check the review
  await manager.getReview(1);
  
  // Check token balance
  const userAddress = process.env.USER_ADDRESS || "0x..."; // Replace with actual user address
  await manager.getTokenBalance(userAddress);
  
  // Check review score
  await manager.getUserReviewScore(userAddress);
};

main(); 