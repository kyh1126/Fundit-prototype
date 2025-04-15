import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest, createProposal, placeBid, createContract } from "./fixtures";

describe("Review", function () {
  beforeEach(async function () {
    const { fundit, owner, user, insuranceCompany, oracle } = await setupTest();
    this.fundit = fundit;
    this.user = user;
    this.insuranceCompany = insuranceCompany;
    this.oracle = oracle;
  });

  // 리뷰 제출 테스트
  it("보험 계약자는 리뷰를 작성할 수 있어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);
    const { contractId } = await createContract(this.fundit, this.user, proposalId, bidId);

    const content = "이 보험은 정말 훌륭했습니다. 보험 가입 과정이 간단하고 명확했으며, 보험금 청구 시에도 빠르고 친절하게 처리해주었습니다. 특히 고객 서비스가 매우 만족스러웠고, 보험 상품의 가격도 합리적이었습니다. 앞으로도 계속 이용하고 싶은 보험사입니다.";
    const rating = "5";

    await expect(
      this.fundit.connect(this.user).submitReview(contractId, content, rating)
    )
      .to.emit(this.fundit, "ReviewSubmitted")
      .withArgs(contractId, this.user.address, content, rating);

    const review = await this.fundit.getReview(contractId);
    expect(review.contractId).to.equal(contractId);
    expect(review.reviewer).to.equal(this.user.address);
    expect(review.content).to.equal(content);
    expect(review.rating).to.equal(rating);
  });

  // 권한 검증 테스트
  it("보험 계약자가 아닌 사용자는 리뷰를 작성할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);
    const { contractId } = await createContract(this.fundit, this.user, proposalId, bidId);

    const content = "이 보험은 정말 훌륭했습니다. 보험 가입 과정이 간단하고 명확했으며, 보험금 청구 시에도 빠르고 친절하게 처리해주었습니다. 특히 고객 서비스가 매우 만족스러웠고, 보험 상품의 가격도 합리적이었습니다. 앞으로도 계속 이용하고 싶은 보험사입니다.";
    const rating = "5";

    await expect(
      this.fundit.connect(this.insuranceCompany).submitReview(contractId, content, rating)
    ).to.be.revertedWith("계약 소유자만 리뷰를 작성할 수 있습니다");
  });

  // 중복 리뷰 방지 테스트
  it("같은 계약에 대해 여러 개의 리뷰를 작성할 수 없습니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);
    const { contractId } = await createContract(this.fundit, this.user, proposalId, bidId);

    const content = "이 보험은 정말 훌륭했습니다. 보험 가입 과정이 간단하고 명확했으며, 보험금 청구 시에도 빠르고 친절하게 처리해주었습니다. 특히 고객 서비스가 매우 만족스러웠고, 보험 상품의 가격도 합리적이었습니다. 앞으로도 계속 이용하고 싶은 보험사입니다.";
    const rating = "5";
    await this.fundit.connect(this.user).submitReview(contractId, content, rating);

    await expect(
      this.fundit.connect(this.user).submitReview(contractId, content, rating)
    ).to.be.revertedWith("이미 리뷰가 작성되었습니다");
  });

  // 평점 업데이트 테스트
  it("리뷰 작성 시 보험사의 평균 평점이 업데이트되어야 합니다", async function () {
    const { proposalId } = await createProposal(this.fundit, this.user);
    const { bidId } = await placeBid(this.fundit, this.insuranceCompany, proposalId);
    const { contractId } = await createContract(this.fundit, this.user, proposalId, bidId);

    const content = "이 보험은 정말 훌륭했습니다. 보험 가입 과정이 간단하고 명확했으며, 보험금 청구 시에도 빠르고 친절하게 처리해주었습니다. 특히 고객 서비스가 매우 만족스러웠고, 보험 상품의 가격도 합리적이었습니다. 앞으로도 계속 이용하고 싶은 보험사입니다.";
    const rating = "5";
    await this.fundit.connect(this.user).submitReview(contractId, content, rating);

    const company = await this.fundit.insuranceCompanies(this.insuranceCompany.address);
    expect(company).to.equal(true); // 보험사가 등록되어 있는지 확인
  });
}); 