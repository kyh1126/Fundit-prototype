import { expect } from "chai";
import { ethers } from "hardhat";
import { Fundit, FunditToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Log } from "@ethersproject/abstract-provider";
import { EventLog } from "ethers";

/**
 * @title 리뷰 시스템 테스트
 * @description 보험 계약에 대한 리뷰 제출, 수정, 삭제, 신고 기능을 테스트합니다.
 */
describe("리뷰 시스템", function () {
  let fundit: Fundit;
  let funditToken: FunditToken;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let otherUser: SignerWithAddress;
  let insuranceCompany: SignerWithAddress;
  let proposalId: bigint;
  let contractId: bigint;

  /**
   * @description 각 테스트 실행 전에 실행되는 설정 함수
   * - 컨트랙트 배포
   * - 테스트 계정 설정
   * - 제안 생성 및 계약 체결
   */
  beforeEach(async function () {
    [owner, user, otherUser, insuranceCompany] = await ethers.getSigners();
    
    // FunditToken 배포
    const FunditToken = await ethers.getContractFactory("FunditToken");
    funditToken = await FunditToken.deploy();
    await funditToken.waitForDeployment();

    // Fundit 배포
    const Fundit = await ethers.getContractFactory("Fundit");
    fundit = await Fundit.deploy();
    await fundit.waitForDeployment();

    // FunditToken 주소 설정
    await fundit.setFunditToken(await funditToken.getAddress());

    // 제안 생성
    const tx = await fundit.connect(user).proposeInsurance(
      "테스트 제안",
      "테스트 설명",
      ethers.parseEther("0.1"), // 0.1 ETH 보험료
      ethers.parseEther("1.0"), // 1.0 ETH 보장금액
      86400n // 1일
    );
    const receipt = await tx.wait();
    if (!receipt) throw new Error("트랜잭션 영수증이 없습니다");

    const event = receipt.logs.find((log) => {
      if (log instanceof EventLog) {
        return log.eventName === "ProposalCreated";
      }
      return false;
    });

    if (!event || !(event instanceof EventLog)) {
      throw new Error("ProposalCreated 이벤트를 찾을 수 없습니다");
    }

    proposalId = event.args[0];

    // 보험사 등록
    await fundit.connect(insuranceCompany).registerInsuranceCompany();

    // 입찰 제출
    const bidTx = await fundit.connect(insuranceCompany).placeBid(
      proposalId,
      ethers.parseEther("0.1"),
      ethers.parseEther("1.0"),
      "테스트 약관"
    );
    await bidTx.wait();

    // 입찰 수락
    const acceptTx = await fundit.connect(user).acceptBid(proposalId, 1n);
    const acceptReceipt = await acceptTx.wait();
    if (!acceptReceipt) throw new Error("입찰 수락 영수증이 없습니다");

    const contractEvent = acceptReceipt.logs.find((log) => {
      if (log instanceof EventLog) {
        return log.eventName === "ContractCreated";
      }
      return false;
    });

    if (!contractEvent || !(contractEvent instanceof EventLog)) {
      throw new Error("ContractCreated 이벤트를 찾을 수 없습니다");
    }

    contractId = contractEvent.args[0];
  });

  /**
   * @title 리뷰 제출 테스트
   * @description 계약 소유자의 리뷰 제출 기능을 테스트합니다.
   */
  describe("리뷰 제출", function () {
    it("계약 소유자가 리뷰를 제출할 수 있어야 합니다", async function () {
      await expect(fundit.connect(user).submitReview(contractId, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다.", 4))
        .to.emit(fundit, "ReviewSubmitted")
        .withArgs(contractId, user.address, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다.", 4);
    });

    it("계약 소유자만 리뷰를 제출할 수 있어야 합니다", async function () {
      await expect(
        fundit.connect(otherUser).submitReview(contractId, "좋은 서비스입니다!", 4)
      ).to.be.revertedWith("계약 소유자만 리뷰를 제출할 수 있습니다");
    });

    it("빈 리뷰 내용은 제출할 수 없어야 합니다", async function () {
      await expect(fundit.connect(user).submitReview(contractId, "", 4))
        .to.be.revertedWith("리뷰 내용은 비어있을 수 없습니다");
    });

    it("동일한 계약에 대해 여러 개의 리뷰를 제출할 수 없어야 합니다", async function () {
      await fundit.connect(user).submitReview(contractId, "좋은 서비스입니다! 이 보험사는 뛰어난 보장과 고객 서비스를 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 문의사항에 항상 신속하게 응답했습니다. 보험료는 경쟁력이 있었고, 보장 조건은 명확하게 설명되었습니다. 특히 위험 관리에 대한 적극적인 접근과 고객 만족을 위한 노력이 인상적이었습니다. 전반적으로 훌륭한 경험이었고, 저는 충성도 높은 고객이 되었습니다.", 4);
      await expect(
        fundit.connect(user).submitReview(contractId, "다른 리뷰", 5)
      ).to.be.revertedWith("이미 리뷰가 제출되었습니다");
    });

    it("리뷰 제출 시 사용자에게 토큰을 보상해야 합니다", async function () {
      const reviewContent = "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다. 신뢰할 수 있는 보험 보장을 찾는 다른 분들에게도 이 서비스를 추천합니다.";
      const tx = await fundit.connect(user).submitReview(contractId, reviewContent, 4);
      await tx.wait();

      const userReviewScore = await funditToken.getUserReviewScore(user.address);
      expect(userReviewScore).to.be.gt(0n);

      const userRewardAmount = await funditToken.getUserTotalRewards(user.address);
      expect(userRewardAmount).to.be.gt(0n);
    });
  });

  /**
   * @title 리뷰 수정 테스트
   * @description 리뷰 수정 기능을 테스트합니다.
   */
  describe("리뷰 수정", function () {
    beforeEach(async function () {
      await fundit.connect(user).submitReview(contractId, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다.", 4);
    });

    it("리뷰 작성자가 리뷰를 수정할 수 있어야 합니다", async function () {
      const tx = await fundit.connect(user).modifyReview(contractId, "수정된 리뷰", 5);
      const receipt = await tx.wait();
      
      expect(receipt?.status).to.equal(1);
      const review = await fundit.getReview(contractId);
      expect(review.rating).to.equal(5n);
      expect(review.content).to.equal("수정된 리뷰");
    });

    it("리뷰 작성자만 리뷰를 수정할 수 있어야 합니다", async function () {
      await expect(
        fundit.connect(otherUser).modifyReview(contractId, "수정된 리뷰", 5)
      ).to.be.revertedWith("리뷰 작성자만 수정할 수 있습니다");
    });

    it("조사 중인 리뷰는 수정할 수 없어야 합니다", async function () {
      await fundit.connect(otherUser).reportReview(contractId, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다. 작성된 내용이 실제 제공된 서비스를 정확하게 반영하지 않습니다.");
      await expect(
        fundit.connect(user).modifyReview(contractId, "이 보험 서비스는 모든 면에서 제 기대를 뛰어넘었습니다. 보장 범위가 포괄적이었고, 팀은 모든 문의사항을 전문적으로 처리했습니다.", 4)
      ).to.be.revertedWith("조사 중인 리뷰는 수정할 수 없습니다");
    });

    it("리뷰 수정이 가능해야 합니다", async function () {
      await fundit.connect(user).modifyReview(contractId, "이 보험 서비스는 모든 면에서 제 기대를 뛰어넘었습니다. 보장 범위가 포괄적이었고, 팀은 모든 문의사항을 전문적으로 처리했습니다. 신뢰할 수 있는 보험을 찾는 모든 분들에게 이 서비스를 추천합니다.", 4);
    });

    it("ReviewModified 이벤트가 발생해야 합니다", async function () {
      await expect(fundit.connect(user).modifyReview(contractId, "이 보험 서비스를 더 오래 사용해본 결과, 보장 옵션이 포괄적이고 다양한 요구에 적합하다고 확신합니다. 팀은 계속해서 뛰어난 지원을 제공하고 있습니다.", 4))
        .to.emit(fundit, "ReviewModified")
        .withArgs(contractId);
    });

    it("리뷰 삭제가 가능해야 합니다", async function () {
      await expect(fundit.connect(user).deleteReview(contractId))
        .to.emit(fundit, "ReviewDeleted")
        .withArgs(contractId);
    });

    it("리뷰 신고가 가능해야 합니다", async function () {
      await expect(fundit.connect(otherUser).reportReview(contractId, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다. 작성된 내용이 실제 제공된 서비스를 정확하게 반영하지 않습니다."))
        .to.emit(fundit, "ReviewReported")
        .withArgs(contractId, otherUser.address, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다. 작성된 내용이 실제 제공된 서비스를 정확하게 반영하지 않습니다.");
    });
  });

  /**
   * @title 리뷰 삭제 테스트
   * @description 리뷰 삭제 기능을 테스트합니다.
   */
  describe("리뷰 삭제", function () {
    beforeEach(async function () {
      await fundit.connect(user).submitReview(contractId, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다.", 4);
    });

    it("리뷰 작성자가 리뷰를 삭제할 수 있어야 합니다", async function () {
      const tx = await fundit.connect(user).deleteReview(contractId);
      const receipt = await tx.wait();
      
      expect(receipt?.status).to.equal(1);
      const review = await fundit.getReview(contractId);
      expect(review.content).to.equal("");
    });

    it("리뷰 작성자만 리뷰를 삭제할 수 있어야 합니다", async function () {
      await expect(
        fundit.connect(otherUser).deleteReview(contractId)
      ).to.be.revertedWith("리뷰 작성자만 삭제할 수 있습니다");
    });

    it("조사 중인 리뷰는 삭제할 수 없어야 합니다", async function () {
      await fundit.connect(otherUser).reportReview(contractId, "부적절한 내용");
      await expect(
        fundit.connect(user).deleteReview(contractId)
      ).to.be.revertedWith("조사 중인 리뷰는 삭제할 수 없습니다");
    });
  });

  /**
   * @title 리뷰 신고 테스트
   * @description 리뷰 신고 기능을 테스트합니다.
   */
  describe("리뷰 신고", function () {
    beforeEach(async function () {
      await fundit.connect(user).submitReview(contractId, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다.", 4);
    });

    it("사용자가 리뷰를 신고할 수 있어야 합니다", async function () {
      await expect(fundit.connect(otherUser).reportReview(contractId, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다. 작성된 내용이 실제 제공된 서비스를 정확하게 반영하지 않습니다."))
        .to.emit(fundit, "ReviewReported")
        .withArgs(contractId, otherUser.address, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다. 작성된 내용이 실제 제공된 서비스를 정확하게 반영하지 않습니다.");
      
      const review = await fundit.getReview(contractId);
      expect(review.underReview).to.be.true;
    });

    it("조사 중인 리뷰는 다시 신고할 수 없어야 합니다", async function () {
      await fundit.connect(otherUser).reportReview(contractId, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다.");
      await expect(
        fundit.connect(otherUser).reportReview(contractId, "다른 신고")
      ).to.be.revertedWith("이미 조사 중인 리뷰입니다");
    });
  });

  /**
   * @title 리뷰 신고 처리 테스트
   * @description 리뷰 신고 처리 기능을 테스트합니다.
   */
  describe("리뷰 신고 처리", function () {
    beforeEach(async function () {
      await fundit.connect(user).submitReview(contractId, "이 보험 서비스는 제가 필요로 하는 모든 보장을 제공했습니다. 청구 절차가 원활하고 효율적이었으며, 고객 서비스 팀은 전체 과정에서 매우 반응적이고 도움이 되었습니다. 신뢰할 수 있는 보험 보장을 찾는 다른 분들에게도 이 서비스를 추천합니다.", 4);
      await fundit.connect(otherUser).reportReview(contractId, "이 리뷰는 보험 보장과 청구 절차에 대해 잘못된 정보를 포함하고 있습니다.");
    });

    it("관리자가 리뷰 신고를 처리할 수 있어야 합니다", async function () {
      await fundit.transferOwnership(user.address);
      const tx = await fundit.connect(user).handleReviewReport(contractId, true);
      const receipt = await tx.wait();
      
      expect(receipt?.status).to.equal(1);
      const review = await fundit.getReview(contractId);
      expect(review.content).to.equal("");
    });

    it("관리자만 리뷰 신고를 처리할 수 있어야 합니다", async function () {
      await expect(
        fundit.connect(otherUser).handleReviewReport(contractId, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 