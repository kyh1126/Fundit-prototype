import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal, placeBid, acceptBid } from "./fixtures";

describe("Contract", function () {
  beforeEach(async function () {
    const setup = await setupTest();
    this.fundit = setup.fundit;
    this.user = setup.user;
    this.insuranceCompany = setup.insuranceCompany;
  });

  it("제안자가 입찰을 수락하면 계약이 생성되어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);
    await acceptBid(this.fundit, proposalId, bidId, this.user);

    const contract = await this.fundit.getContract(1);
    expect(contract.proposalId).to.equal(proposalId);
    expect(contract.bidId).to.equal(bidId);
    expect(contract.proposer).to.equal(this.user.address);
    expect(contract.insurer).to.equal(this.insuranceCompany.address);
  });

  it("제안자가 아닌 사용자는 입찰을 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);

    await expect(
      acceptBid(this.fundit, proposalId, bidId, this.insuranceCompany)
    ).to.be.revertedWith("Only proposer can accept bid");
  });

  it("존재하지 않는 제안에 대한 입찰은 수락할 수 없습니다", async function () {
    const nonExistentProposalId = 999;

    await expect(
      acceptBid(this.fundit, nonExistentProposalId, 1, this.user)
    ).to.be.revertedWith("Proposal does not exist");
  });

  it("존재하지 않는 입찰은 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const nonExistentBidId = 999;

    await expect(
      acceptBid(this.fundit, proposalId, nonExistentBidId, this.user)
    ).to.be.revertedWith("Bid does not exist");
  });

  it("비활성화된 제안에 대한 입찰은 수락할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    
    // 제안을 비활성화
    await this.fundit.connect(this.user).cancelProposal(proposalId);

    await expect(
      placeBid(this.fundit, this.insuranceCompany, proposalId)
    ).to.be.revertedWith("Proposal is not active");
  });
}); 