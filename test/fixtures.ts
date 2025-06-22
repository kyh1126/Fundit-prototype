import { ethers } from "hardhat";
import type { Fundit, FunditToken } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

export interface TestContext {
  fundit: Fundit;
  funditToken: FunditToken;
  owner: SignerWithAddress;
  user: SignerWithAddress;
  insuranceCompany: SignerWithAddress;
  oracle: SignerWithAddress;
}

export interface TestSetup {
  fundit: Fundit;
  funditToken: FunditToken;
  owner: any;
  user: any;
  insuranceCompany: any;
  oracle: any;
}

export async function setupTest(): Promise<TestSetup> {
  const [owner, user, insuranceCompany, oracle] = await ethers.getSigners();

  const FunditToken = await ethers.getContractFactory("FunditToken");
  const funditToken = await FunditToken.deploy();
  await funditToken.waitForDeployment();

  const Fundit = await ethers.getContractFactory("Fundit");
  const fundit = await Fundit.deploy();
  await fundit.waitForDeployment();

  await fundit.setFunditToken(await funditToken.getAddress());
  await fundit.registerOracle(oracle.address);
  await fundit.connect(insuranceCompany).registerInsuranceCompany();

  return { fundit, funditToken, owner, user, insuranceCompany, oracle };
}

export async function createProposal(
  fundit: Fundit,
  user: any,
  title: string = "여행자 보험",
  description: string = "해외 여행 중 발생할 수 있는 사고에 대한 보험",
  premium: bigint = ethers.parseEther("0.1"),
  coverage: bigint = ethers.parseEther("1.0"),
  duration: number = 30 * 24 * 60 * 60
) {
  const tx = await fundit.connect(user).proposeInsurance(
    title,
    description,
    premium,
    coverage,
    duration
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const proposalId = event.topics[1];
  return { proposalId, tx };
}

export async function placeBid(
  fundit: Fundit,
  insuranceCompany: any,
  proposalId: bigint,
  premium: bigint = ethers.parseEther("0.1"),
  coverage: bigint = ethers.parseEther("1.0"),
  terms: string = "테스트 입찰 조건",
  bidDuration: number = 3 * 24 * 60 * 60 // 3일
) {
  const tx = await fundit.connect(insuranceCompany).placeBid(
    proposalId,
    premium,
    coverage,
    terms,
    bidDuration
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const bidId = event.topics[1];
  return { bidId, tx };
}

export async function createContract(
  fundit: Fundit,
  user: any,
  proposalId: bigint,
  bidId: bigint,
  duration: number = 30 * 24 * 60 * 60
) {
  const tx = await fundit.connect(user).acceptBid(proposalId, bidId, duration);
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const contractId = event.topics[1];
  return { contractId, tx };
}

export async function submitClaim(
  fundit: Fundit,
  user: SignerWithAddress,
  contractId: number,
  amount: bigint,
  description: string
): Promise<{ claimId: number }> {
  const evidence = "테스트 증거: 청구에 대한 상세한 증거 자료입니다. 이 증거는 청구의 유효성을 입증하기 위한 충분한 정보를 포함하고 있습니다.";
  const tx = await fundit.connect(user).submitClaim(
    contractId,
    description,
    amount,
    evidence
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const claimId = Number(event.topics[1]);
  return { claimId };
}

export async function submitOracleVerification(
  fundit: Fundit,
  oracle: SignerWithAddress,
  contractId: number,
  approved: boolean,
  evidence: string
): Promise<void> {
  const tx = await fundit.connect(oracle).submitOracleVerification(
    contractId,
    approved,
    evidence
  );
  await tx.wait();
}

export async function submitReview(
  fundit: Fundit,
  user: SignerWithAddress,
  contractId: number,
  rating: number,
  comment: string
): Promise<{ reviewId: number }> {
  const tx = await fundit.connect(user).submitReview(
    contractId,
    comment,
    rating
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const reviewId = Number(event.topics[1]);
  return { reviewId };
} 