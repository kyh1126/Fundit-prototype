const ContractManager = require("./ContractManager");
const { ethers } = require("hardhat");

require("dotenv").config();

const main = async () => {
  // 컨트랙트 주소 설정
  const CA = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const TOKEN_CA = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // 컨트랙트 매니저 초기화
  const manager = new ContractManager(CA, TOKEN_CA);
  await manager.initialize();

  // 리뷰 제출
  const contractId = 0; // 리뷰를 작성할 계약 ID
  const content = "보험금 지급이 빠르고 정확했습니다. 매우 만족스럽습니다.";
  const rating = 9; // 1-10 사이의 평점

  console.log("리뷰를 제출합니다...");
  await manager.submitReview(contractId, content, rating);

  // 리뷰 확인
  console.log("제출된 리뷰를 확인합니다...");
  const review = await manager.getReview(contractId);
  console.log("리뷰 정보:", review);

  // 토큰 잔액 확인
  const [signer] = await ethers.getSigners();
  const balance = await manager.getTokenBalance(signer.address);
  console.log("현재 토큰 잔액:", balance);

  // 리뷰 점수 확인
  const score = await manager.getUserReviewScore(signer.address);
  console.log("현재 리뷰 점수:", score);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 