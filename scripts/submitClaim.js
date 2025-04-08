const ContractManager = require("./ContractManager");
const { ethers } = require("hardhat");

require("dotenv").config();

async function main() {
  // 컨트랙트 주소 설정
  const CA = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TOKEN_CA = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // 컨트랙트 매니저 초기화
  const manager = new ContractManager(CA, TOKEN_CA);
  await manager.initialize();

  // 보험금 청구 제출
  const contractId = 0; // 청구할 계약 ID
  const description = "자동차 사고로 인한 수리비 청구";
  const amount = "0.5"; // ETH 단위

  console.log("보험금 청구를 제출합니다...");
  await manager.submitClaim(contractId, description, amount);

  // 청구 처리 (실제 환경에서는 오라클 응답을 기다려야 함)
  console.log("청구를 처리합니다...");
  await manager.processClaim(contractId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 