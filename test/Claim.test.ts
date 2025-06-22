import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal, placeBid, createContract } from "./fixtures";

describe("Claim", function () {
  // 청구 제출 테스트
  it("보험 계약자는 청구를 제출할 수 있어야 합니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, BigInt(proposalId));
    const { contractId } = await createContract(fundit, user, BigInt(proposalId), BigInt(bidId));

    const claimAmount = ethers.parseEther("0.5");
    const description = "테스트 청구: 보험 사고가 발생하여 청구를 제출합니다. 이 청구는 유효한 사고에 대한 것입니다. 상세한 사고 내용과 피해 상황을 포함하여 충분한 정보를 제공합니다.";
    const evidence = "테스트 증거: 청구에 대한 상세한 증거 자료입니다. 이 증거는 청구의 유효성을 입증하기 위한 충분한 정보를 포함하고 있습니다. 사고 현장 사진, 의료 기록, 경찰 신고서 등 모든 관련 문서를 첨부합니다.";

    await expect(
      fundit.connect(user).submitClaim(contractId, description, claimAmount, evidence)
    )
      .to.emit(fundit, "ClaimSubmitted")
      .withArgs(contractId, user.address, claimAmount);

    const claimAmountStored = await fundit.claimAmounts(contractId);
    const claimProcessed = await fundit.claimsProcessed(contractId);
    expect(claimAmountStored).to.equal(claimAmount);
    expect(claimProcessed).to.equal(false);
  });

  // 권한 검증 테스트
  it("보험 계약자가 아닌 사용자는 청구를 제출할 수 없습니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, BigInt(proposalId));
    const { contractId } = await createContract(fundit, user, BigInt(proposalId), BigInt(bidId));

    const claimAmount = ethers.parseEther("0.5");
    const description = "테스트 청구: 보험 사고가 발생하여 청구를 제출합니다. 이 청구는 유효한 사고에 대한 것입니다. 상세한 사고 내용과 피해 상황을 포함하여 충분한 정보를 제공합니다.";
    const evidence = "테스트 증거: 청구에 대한 상세한 증거 자료입니다. 이 증거는 청구의 유효성을 입증하기 위한 충분한 정보를 포함하고 있습니다. 사고 현장 사진, 의료 기록, 경찰 신고서 등 모든 관련 문서를 첨부합니다.";

    await expect(
      fundit.connect(insuranceCompany).submitClaim(contractId, description, claimAmount, evidence)
    ).to.be.revertedWith("계약 소유자가 아닙니다");
  });

  // 오라클 검증 테스트
  it("오라클은 청구를 검증할 수 있어야 합니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, BigInt(proposalId));
    const { contractId } = await createContract(fundit, user, BigInt(proposalId), BigInt(bidId));

    // Oracle을 계약에 할당
    await fundit.connect(owner).assignOraclesToContract(contractId, [oracle.address]);

    const claimAmount = ethers.parseEther("0.5");
    const description = "테스트 청구: 보험 사고가 발생하여 청구를 제출합니다. 이 청구는 유효한 사고에 대한 것입니다. 상세한 사고 내용과 피해 상황을 포함하여 충분한 정보를 제공합니다.";
    const evidence = "테스트 증거: 청구에 대한 상세한 증거 자료입니다. 이 증거는 청구의 유효성을 입증하기 위한 충분한 정보를 포함하고 있습니다. 사고 현장 사진, 의료 기록, 경찰 신고서 등 모든 관련 문서를 첨부합니다.";
    await fundit.connect(user).submitClaim(contractId, description, claimAmount, evidence);

    const oracleEvidence = "Oracle 검증 증거: 이 청구는 유효한 것으로 확인되었습니다. 상세한 검증 과정과 결과를 포함합니다. 모든 증거를 검토한 결과, 청구 내용이 사실과 일치하며 보험금 지급이 적절하다고 판단됩니다.";
    await expect(
      fundit.connect(oracle).submitOracleVerification(contractId, true, oracleEvidence)
    )
      .to.emit(fundit, "OracleVerificationSubmitted")
      .withArgs(contractId, oracle.address, true);

    const claimProcessed = await fundit.claimsProcessed(contractId);
    expect(claimProcessed).to.equal(false);
  });

  // 권한 검증 테스트
  it("오라클이 아닌 사용자는 청구를 검증할 수 없습니다", async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    const { proposalId } = await createProposal(fundit, user);
    const { bidId } = await placeBid(fundit, insuranceCompany, BigInt(proposalId));
    const { contractId } = await createContract(fundit, user, BigInt(proposalId), BigInt(bidId));

    // Oracle을 계약에 할당
    await fundit.connect(owner).assignOraclesToContract(contractId, [oracle.address]);

    const claimAmount = ethers.parseEther("0.5");
    const description = "테스트 청구: 보험 사고가 발생하여 청구를 제출합니다. 이 청구는 유효한 사고에 대한 것입니다. 상세한 사고 내용과 피해 상황을 포함하여 충분한 정보를 제공합니다.";
    const evidence = "테스트 증거: 청구에 대한 상세한 증거 자료입니다. 이 증거는 청구의 유효성을 입증하기 위한 충분한 정보를 포함하고 있습니다. 사고 현장 사진, 의료 기록, 경찰 신고서 등 모든 관련 문서를 첨부합니다.";
    await fundit.connect(user).submitClaim(contractId, description, claimAmount, evidence);

    const oracleEvidence = "Oracle 검증 증거: 이 청구는 유효한 것으로 확인되었습니다. 상세한 검증 과정과 결과를 포함합니다. 모든 증거를 검토한 결과, 청구 내용이 사실과 일치하며 보험금 지급이 적절하다고 판단됩니다.";
    await expect(
      fundit.connect(user).submitOracleVerification(contractId, true, oracleEvidence)
    ).to.be.revertedWith("계약에 할당되지 않은 Oracle입니다");
  });
}); 