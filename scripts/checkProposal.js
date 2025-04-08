const ContractManager = require("./ContractManager");
require("dotenv").config();

const main = async () => {
  const CA = "0xaF30C3c1485232d5876707cEf7bB930F0e7a89d2";

  const manager = new ContractManager(CA);
  await manager.getOwner();
  await manager.getProposal(1); // Check proposal with ID 1
};

main(); 