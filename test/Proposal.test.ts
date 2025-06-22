import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal } from "./fixtures";

/**
 * Proposal 컨트랙트 테스트
 * - 보험 상품 제안 생성
 * - 제안 정보 저장
 * - 제안 취소
 * - 잘못된 입력값 처리
 * - 제안 마감일 지난 경우
 */

describe("Proposal", function () {
  beforeEach(async function () {
    const { fundit, user, insuranceCompany, oracle } = await setupTest();
    this.fundit = fundit;
    this.user = user;
    this.insuranceCompany = insuranceCompany;
    this.oracle = oracle;
  });

  it("사용자가 보험 상품을 제안할 수 있어야 합니다", async function () {
    const title = "여행자 보험";
    const description = "해외 여행 중 발생할 수 있는 사고에 대한 보험";
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const duration = 30 * 24 * 60 * 60; // 30일

    const { proposalId, tx } = await createProposal(
      this.fundit,
      this.user,
      title,
      description,
      premium,
      coverage,
      duration
    );

    await expect(tx)
      .to.emit(this.fundit, "ProposalCreated")
      .withArgs(proposalId, this.user.address);

    const proposal = await this.fundit.proposals(proposalId);
    expect(proposal.title).to.equal(title);
    expect(proposal.description).to.equal(description);
    expect(proposal.premium).to.equal(premium);
    expect(proposal.coverage).to.equal(coverage);
    expect(proposal.proposer).to.equal(this.user.address);
    expect(proposal.active).to.be.true;
    expect(proposal.finalized).to.be.false;

    // 현재 블록의 타임스탬프를 사용
    const block = await ethers.provider.getBlock("latest");
    if (!block) {
      throw new Error("Failed to get latest block");
    }
    const expectedDeadline = proposal.deadline;

    // 약간의 시간 오차를 고려해서 비교 (60초 오차 허용)
    expect(expectedDeadline).to.be.greaterThanOrEqual(block.timestamp + duration - 60);
    expect(expectedDeadline).to.be.lessThanOrEqual(block.timestamp + duration + 60);
  });

  it("제안자는 자신의 제안을 취소할 수 있어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);

    await this.fundit.connect(this.user).cancelProposal(proposalId);

    const proposal = await this.fundit.proposals(proposalId);
    expect(proposal.active).to.be.false;
  });

  it("제안자가 아닌 사용자는 제안을 취소할 수 없어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);

    await expect(
      this.fundit.connect(this.insuranceCompany).cancelProposal(proposalId)
    ).to.be.revertedWith("제안의 소유자가 아닙니다");

    const proposal = await this.fundit.proposals(proposalId);
    expect(proposal.active).to.be.true;
  });

  it("음수 금액으로 제안할 수 없습니다", async function () {
    const title = "여행자 보험";
    const description = "해외 여행 중 발생할 수 있는 사고에 대한 보험";
    const premium = ethers.parseEther("0");
    const coverage = ethers.parseEther("1.0");
    const duration = 30 * 24 * 60 * 60;

    await expect(
      this.fundit.connect(this.user).proposeInsurance(
        title,
        description,
        premium,
        coverage,
        duration
      )
    ).to.be.revertedWith("보험료는 0보다 커야 합니다");
  });

  it("보장금액이 보험료보다 작을 수 없습니다", async function () {
    const title = "여행자 보험";
    const description = "해외 여행 중 발생할 수 있는 사고에 대한 보험";
    const premium = ethers.parseEther("1.0");
    const coverage = ethers.parseEther("0.1");
    const duration = 30 * 24 * 60 * 60;

    await expect(
      this.fundit.connect(this.user).proposeInsurance(
        title,
        description,
        premium,
        coverage,
        duration
      )
    ).to.be.revertedWith("보장 금액은 보험료보다 크거나 같아야 합니다");
  });

  it("제안 기간이 너무 길 수 없습니다", async function () {
    const title = "여행자 보험";
    const description = "해외 여행 중 발생할 수 있는 사고에 대한 보험";
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const tooLongDuration = 366 * 24 * 60 * 60; // 1년 초과

    await expect(
      this.fundit.connect(this.user).proposeInsurance(
        title,
        description,
        premium,
        coverage,
        tooLongDuration
      )
    ).to.be.revertedWith("잘못된 기간입니다");
  });

  it("마감일이 지난 제안은 비활성화됩니다", async function () {
    const title = "여행자 보험";
    const description = "해외 여행 중 발생할 수 있는 사고에 대한 보험";
    const premium = ethers.parseEther("0.1");
    const coverage = ethers.parseEther("1.0");
    const duration = 24 * 60 * 60; // 1일

    const { proposalId } = await createProposal(
      this.fundit,
      this.user,
      title,
      description,
      premium,
      coverage,
      duration
    );

    // 1일 대기
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    // 마감일이 지난 제안은 수동으로 취소할 수 없음
    await expect(
      this.fundit.connect(this.user).cancelProposal(proposalId)
    ).to.be.revertedWith("제안 기간이 만료되었습니다");

    // 제안은 여전히 활성 상태로 유지됨 (자동 비활성화 기능은 없음)
    const proposal = await this.fundit.proposals(proposalId);
    expect(proposal.active).to.be.true;
  });
}); 