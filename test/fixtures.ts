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

export async function createProposal(fundit: Fundit, user: SignerWithAddress): Promise<{ proposalId: number }> {
    const title = "Test Proposal";
    const description = "Test Description";
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const duration = 7 * 24 * 60 * 60; // 7 days

    const tx = await fundit.connect(user).proposeInsurance(title, description, premium, coverage, duration);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");
    const event = receipt.logs[0];
    const proposalId = Number(event.topics[1]);
    return { proposalId };
}

export async function placeBid(
  fundit: Fundit,
  insuranceCompany: SignerWithAddress,
  proposalId: number,
  premium: bigint = ethers.parseEther("0.1"),
  coverage: bigint = ethers.parseEther("1.0"),
  terms: string = "테스트 입찰 조건"
) {
  const tx = await fundit.connect(insuranceCompany).placeBid(
    proposalId,
    premium,
    coverage,
    terms
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction receipt is null");
  const event = receipt.logs[0];
  const bidId = Number(event.topics[1]);
  return { bidId, tx };
}

export async function acceptBid(fundit: Fundit, proposalId: number, bidId: number, proposer: SignerWithAddress) {
    const tx = await fundit.connect(proposer).acceptBid(proposalId, bidId);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");
    return { contractId: 1 };  // 첫 번째 계약이므로 ID는 1
}

export async function submitClaim(
  fundit: Fundit,
  user: SignerWithAddress,
  contractId: number,
  amount: bigint,
  description: string,
  evidence: string = "Test evidence"
): Promise<{ claimId: number }> {
  const tx = await fundit.connect(user).submitClaim(
    contractId,
    amount,
    description,
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
  claimId: number,
  result: boolean,
  comment: string
): Promise<void> {
  const tx = await fundit.connect(oracle).submitOracleVerification(
    claimId,
    result,
    comment
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

export async function setup() {
  const [owner, user, insuranceCompany, otherUser] = await ethers.getSigners();
  const Fundit = await ethers.getContractFactory("Fundit");
  const fundit = await Fundit.deploy();
  await fundit.waitForDeployment();

  return {
    fundit,
    owner,
    user,
    insuranceCompany,
    otherUser
  };
} 