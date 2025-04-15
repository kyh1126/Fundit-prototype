import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal, placeBid, createContract } from "./fixtures";

describe("Contract", function () {
  beforeEach(async function () {
    const { fundit, user, insuranceCompany } = await setupTest();
    this.fundit = fundit;
    this.user = user;
    this.insuranceCompany = insuranceCompany;
  });

  it("제안자가 입찰을 수락하면 계약이 생성되어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, BigInt(proposalId));
    const { contractId } = await createContract(this.fundit, this.user, BigInt(proposalId), BigInt(bidId));

    const contract = await this.fundit.contracts(contractId);
    expect(contract.proposalId).to.equal(BigInt(proposalId));
    expect(contract.bidId).to.equal(BigInt(bidId));
    expect(contract.proposer).to.equal(this.user.address);
    expect(contract.insuranceCompany).to.equal(this.insuranceCompany.address);
  });

  it("제안자가 아닌 사용자는 입찰을 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, BigInt(proposalId));

    await expect(
      createContract(this.fundit, this.insuranceCompany, BigInt(proposalId), BigInt(bidId))
    ).to.be.revertedWith("Not proposal owner");
  });

  it("존재하지 않는 제안에 대한 입찰은 수락할 수 없습니다", async function () {
    const nonExistentProposalId = BigInt(999);
    
    await expect(
      placeBid(this.fundit, this.insuranceCompany, nonExistentProposalId)
    ).to.be.revertedWith("Proposal does not exist");
  });

  it("존재하지 않는 입찰은 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const nonExistentBidId = BigInt(999);

    await expect(
      createContract(this.fundit, this.user, BigInt(proposalId), nonExistentBidId)
    ).to.be.revertedWith("Bid does not exist");
  });

  it("비활성화된 제안에 대한 입찰은 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, BigInt(proposalId));

    // 제안을 비활성화
    await this.fundit.connect(this.user).cancelProposal(BigInt(proposalId));

    await expect(
      createContract(this.fundit, this.user, BigInt(proposalId), BigInt(bidId))
    ).to.be.revertedWith("Proposal is not active");
  });
}); 