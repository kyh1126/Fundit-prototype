import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal, placeBid, createContract } from "./fixtures";

describe("Claim", function () {
  // 청구 제출 테스트
  it("보험 계약자는 청구를 제출할 수 있어야 합니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, proposalId);
    const { contractId } = await createContract(fundit, user, proposalId, bidId);

    const claimAmount = ethers.parseEther("0.5");

    await expect(
      fundit.connect(user).submitClaim(contractId, claimAmount)
    )
      .to.emit(fundit, "ClaimSubmitted")
      .withArgs(contractId, user.address, claimAmount);

    const claimInfo = await fundit.getClaimInfo(contractId);
    expect(claimInfo.amount).to.equal(claimAmount);
    expect(claimInfo.processed).to.equal(false);
  });

  // 권한 검증 테스트
  it("보험 계약자가 아닌 사용자는 청구를 제출할 수 없습니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, proposalId);
    const { contractId } = await createContract(fundit, user, proposalId, bidId);

    const claimAmount = ethers.parseEther("0.5");

    await expect(
      fundit.connect(insuranceCompany).submitClaim(contractId, claimAmount)
    ).to.be.revertedWith("계약 제안자만 청구를 제출할 수 있습니다");
  });

  // 오라클 검증 테스트
  it("오라클은 청구를 검증할 수 있어야 합니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, proposalId);
    const { contractId } = await createContract(fundit, user, proposalId, bidId);

    const claimAmount = ethers.parseEther("0.5");
    await fundit.connect(user).submitClaim(contractId, claimAmount);

    await expect(
      fundit.connect(oracle).submitOracleVerification(contractId, true)
    )
      .to.emit(fundit, "OracleVerificationSubmitted")
      .withArgs(contractId, oracle.address, true);

    const claimInfo = await fundit.getClaimInfo(contractId);
    expect(claimInfo.processed).to.equal(false);
  });

  // 권한 검증 테스트
  it("오라클이 아닌 사용자는 청구를 검증할 수 없습니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, proposalId);
    const { contractId } = await createContract(fundit, user, proposalId, bidId);

    const claimAmount = ethers.parseEther("0.5");
    await fundit.connect(user).submitClaim(contractId, claimAmount);

    await expect(
      fundit.connect(user).submitOracleVerification(contractId, true)
    ).to.be.revertedWith("등록된 Oracle만 검증을 제출할 수 있습니다");
  });
}); 