import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal } from "./fixtures";

describe("Bid", function () {
  beforeEach(async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    this.fundit = fundit;
    this.user = user;
    this.insuranceCompany = insuranceCompany;
    this.oracle = oracle;
  });

  it("등록된 보험사가 입찰할 수 있어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const terms = "테스트 입찰 조건";

    await expect(
      this.fundit.connect(this.insuranceCompany).placeBid(
        proposalId,
        premium,
        coverage,
        terms
      )
    )
      .to.emit(this.fundit, "BidSubmitted")
      .withArgs(proposalId, this.insuranceCompany.address, premium);
  });

  it("등록되지 않은 보험사는 입찰할 수 없어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const terms = "테스트 입찰 조건";

    await expect(
      this.fundit.connect(this.user).placeBid(
        proposalId,
        premium,
        coverage,
        terms
      )
    ).to.be.revertedWith("Not registered insurance company");
  });
}); 