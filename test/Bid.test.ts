import { expect } from "chai";
import { ethers } from "hardhat";
import { Fundit, FunditToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Bid System", function () {
  let fundit: Fundit;
  let funditToken: FunditToken;
  let owner: HardhatEthersSigner;
  let proposer: HardhatEthersSigner;
  let insuranceCompany1: HardhatEthersSigner;
  let insuranceCompany2: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, proposer, insuranceCompany1, insuranceCompany2, oracle] = await ethers.getSigners();

    const FunditTokenFactory = await ethers.getContractFactory("FunditToken");
    funditToken = await FunditTokenFactory.deploy();
    await funditToken.waitForDeployment();

    const FunditFactory = await ethers.getContractFactory("Fundit");
    fundit = await FunditFactory.deploy();
    await fundit.waitForDeployment();
    
    await fundit.setFunditToken(await funditToken.getAddress());
    await fundit.registerOracle(oracle.address);
  });

  describe("보험사 등록", function () {
    it("보험사가 등록할 수 있어야 한다", async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();
      expect(await fundit.insuranceCompanies(insuranceCompany1.address)).to.be.true;
    });

    it("이미 등록된 보험사는 다시 등록할 수 없어야 한다", async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();
      await expect(
        fundit.connect(insuranceCompany1).registerInsuranceCompany()
      ).to.be.revertedWith("이미 등록된 보험사입니다");
    });
  });

  describe("입찰 제출", function () {
    let proposalId: bigint;

    beforeEach(async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();
      await fundit.connect(insuranceCompany2).registerInsuranceCompany();

      // 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험",
        "테스트 설명",
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        7 * 24 * 60 * 60 // 7일
      );
      proposalId = await fundit.getProposalCount();
    });

    it("등록된 보험사가 입찰을 제출할 수 있어야 한다", async function () {
      const tx = await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "테스트 보장 조건",
        3 * 24 * 60 * 60 // 3일
      );
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      const bidId = event ? BigInt(event.topics[1]) : 0n;

      const bid = await fundit.getBid(bidId);
      expect(bid.insuranceCompany).to.equal(insuranceCompany1.address);
      expect(bid.premium).to.equal(ethers.parseEther("0.8"));
      expect(bid.coverage).to.equal(ethers.parseEther("8"));
      expect(bid.terms).to.equal("테스트 보장 조건");
      expect(bid.active).to.be.true;
    });

    it("등록되지 않은 주소는 입찰을 제출할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(oracle).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("등록되지 않은 보험사입니다");
    });

    it("존재하지 않는 제안에 입찰할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          999n,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("존재하지 않는 제안입니다");
    });

    it("비활성 제안에 입찰할 수 없어야 한다", async function () {
      // 제안 취소
      await fundit.connect(proposer).cancelProposal(proposalId);

      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("제안이 활성화 상태가 아닙니다");
    });

    it("마감된 제안에 입찰할 수 없어야 한다", async function () {
      // 시간을 8일 후로 이동
      await time.increase(8 * 24 * 60 * 60);

      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("제안 기간이 만료되었습니다");
    });

    it("보험료가 0보다 커야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          0,
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("보험료는 0보다 커야 합니다");
    });

    it("보장금액이 보험료보다 크거나 같아야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("5"),
          ethers.parseEther("3"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("보장 금액은 보험료보다 크거나 같아야 합니다");
    });

    it("보장 조건이 비어있으면 안 된다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "",
          3 * 24 * 60 * 60
        )
      ).to.be.revertedWith("보장 조건이 비어있습니다");
    });

    it("입찰 기간이 유효해야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          0 // 최소 기간 미만
        )
      ).to.be.revertedWith("잘못된 입찰 기간입니다");

    await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          10 * 24 * 60 * 60 // 최대 기간 초과
        )
      ).to.be.revertedWith("잘못된 입찰 기간입니다");
    });
  });

  describe("입찰 수정", function () {
    let proposalId: bigint;
    let bidId: bigint;

    beforeEach(async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();

      // 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험",
        "테스트 설명",
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        7 * 24 * 60 * 60
      );
      proposalId = await fundit.getProposalCount();

      // 입찰 생성
      const tx = await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "테스트 보장 조건",
        3 * 24 * 60 * 60
      );
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      bidId = event ? BigInt(event.topics[1]) : 0n;
    });

    it("입찰자는 자신의 입찰을 수정할 수 있어야 한다", async function () {
      await fundit.connect(insuranceCompany1).updateBid(
        bidId,
        ethers.parseEther("0.7"),
        ethers.parseEther("7"),
        "수정된 보장 조건"
      );

      const bid = await fundit.getBid(bidId);
      expect(bid.premium).to.equal(ethers.parseEther("0.7"));
      expect(bid.coverage).to.equal(ethers.parseEther("7"));
      expect(bid.terms).to.equal("수정된 보장 조건");
    });

    it("입찰자가 아닌 사용자는 입찰을 수정할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany2).updateBid(
          bidId,
          ethers.parseEther("0.7"),
          ethers.parseEther("7"),
          "수정된 보장 조건"
        )
      ).to.be.revertedWith("입찰의 소유자가 아닙니다");
    });

    it("존재하지 않는 입찰은 수정할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).updateBid(
          999n,
          ethers.parseEther("0.7"),
          ethers.parseEther("7"),
          "수정된 보장 조건"
        )
      ).to.be.revertedWith("존재하지 않는 입찰입니다");
    });

    it("비활성 입찰은 수정할 수 없어야 한다", async function () {
      // 입찰 취소
      await fundit.connect(insuranceCompany1).cancelBid(bidId);

      await expect(
        fundit.connect(insuranceCompany1).updateBid(
          bidId,
          ethers.parseEther("0.7"),
          ethers.parseEther("7"),
          "수정된 보장 조건"
        )
      ).to.be.revertedWith("입찰이 활성화 상태가 아닙니다");
    });

    it("마감된 입찰은 수정할 수 없어야 한다", async function () {
      // 시간을 4일 후로 이동
      await time.increase(4 * 24 * 60 * 60);

      await expect(
        fundit.connect(insuranceCompany1).updateBid(
          bidId,
          ethers.parseEther("0.7"),
          ethers.parseEther("7"),
          "수정된 보장 조건"
        )
      ).to.be.revertedWith("입찰 기간이 만료되었습니다");
    });
  });

  describe("입찰 취소", function () {
    let proposalId: bigint;
    let bidId: bigint;

    beforeEach(async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();

      // 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험",
        "테스트 설명",
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        7 * 24 * 60 * 60
      );
      proposalId = await fundit.getProposalCount();

      // 입찰 생성
      const tx = await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "테스트 보장 조건",
        3 * 24 * 60 * 60
      );
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      bidId = event ? BigInt(event.topics[1]) : 0n;
    });

    it("입찰자는 자신의 입찰을 취소할 수 있어야 한다", async function () {
      await fundit.connect(insuranceCompany1).cancelBid(bidId);

      const bid = await fundit.getBid(bidId);
      expect(bid.active).to.be.false;
    });

    it("입찰자가 아닌 사용자는 입찰을 취소할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany2).cancelBid(bidId)
      ).to.be.revertedWith("입찰의 소유자가 아닙니다");
    });

    it("존재하지 않는 입찰은 취소할 수 없어야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).cancelBid(999n)
      ).to.be.revertedWith("존재하지 않는 입찰입니다");
    });

    it("비활성 입찰은 취소할 수 없어야 한다", async function () {
      // 입찰 취소
      await fundit.connect(insuranceCompany1).cancelBid(bidId);

      await expect(
        fundit.connect(insuranceCompany1).cancelBid(bidId)
      ).to.be.revertedWith("입찰이 활성화 상태가 아닙니다");
    });

    it("마감된 입찰은 취소할 수 없어야 한다", async function () {
      // 시간을 4일 후로 이동
      await time.increase(4 * 24 * 60 * 60);

      await expect(
        fundit.connect(insuranceCompany1).cancelBid(bidId)
      ).to.be.revertedWith("입찰 기간이 만료되었습니다");
    });
  });

  describe("입찰 조회", function () {
    let proposalId: bigint;

    beforeEach(async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();
      await fundit.connect(insuranceCompany2).registerInsuranceCompany();

      // 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험",
        "테스트 설명",
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        7 * 24 * 60 * 60
      );
      proposalId = await fundit.getProposalCount();
    });

    it("제안에 대한 모든 입찰을 조회할 수 있어야 한다", async function () {
      // 첫 번째 입찰
      await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "첫 번째 보장 조건",
        3 * 24 * 60 * 60
      );

      // 두 번째 입찰
      await fundit.connect(insuranceCompany2).placeBid(
        proposalId,
        ethers.parseEther("0.9"),
        ethers.parseEther("9"),
        "두 번째 보장 조건",
        3 * 24 * 60 * 60
      );

      const bids = await fundit.getProposalBids(proposalId);
      expect(bids.length).to.equal(2);
      expect(bids[0].insuranceCompany).to.equal(insuranceCompany1.address);
      expect(bids[1].insuranceCompany).to.equal(insuranceCompany2.address);
    });

    it("보험사별 입찰 목록을 조회할 수 있어야 한다", async function () {
      // 첫 번째 보험사 입찰
      await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "첫 번째 보장 조건",
        3 * 24 * 60 * 60
      );

      // 두 번째 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험 2",
        "테스트 설명 2",
        ethers.parseEther("2"),
        ethers.parseEther("20"),
        7 * 24 * 60 * 60
      );
      const proposalId2 = await fundit.getProposalCount();

      // 첫 번째 보험사가 두 번째 제안에도 입찰
      await fundit.connect(insuranceCompany1).placeBid(
        proposalId2,
        ethers.parseEther("1.5"),
        ethers.parseEther("15"),
        "두 번째 보장 조건",
        3 * 24 * 60 * 60
      );

      const companyBids = await fundit.getCompanyBids(insuranceCompany1.address);
      expect(companyBids.length).to.equal(2);
    });
  });

  describe("이벤트 발생", function () {
    let proposalId: bigint;

    beforeEach(async function () {
      await fundit.connect(insuranceCompany1).registerInsuranceCompany();

      // 제안 생성
      await fundit.connect(proposer).proposeInsurance(
        "테스트 보험",
        "테스트 설명",
        ethers.parseEther("1"),
        ethers.parseEther("10"),
        7 * 24 * 60 * 60
      );
      proposalId = await fundit.getProposalCount();
    });

    it("입찰 제출 시 이벤트가 발생해야 한다", async function () {
      await expect(
        fundit.connect(insuranceCompany1).placeBid(
          proposalId,
          ethers.parseEther("0.8"),
          ethers.parseEther("8"),
          "테스트 보장 조건",
          3 * 24 * 60 * 60
        )
      )
        .to.emit(fundit, "BidSubmitted")
        .withArgs(proposalId, insuranceCompany1.address, ethers.parseEther("0.8"));
    });

    it("입찰 수정 시 이벤트가 발생해야 한다", async function () {
      const tx = await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "테스트 보장 조건",
        3 * 24 * 60 * 60
      );
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      const bidId = event ? BigInt(event.topics[1]) : 0n;

    await expect(
        fundit.connect(insuranceCompany1).updateBid(
          bidId,
          ethers.parseEther("0.7"),
          ethers.parseEther("7"),
          "수정된 보장 조건"
        )
      )
        .to.emit(fundit, "BidUpdated")
        .withArgs(bidId, insuranceCompany1.address, ethers.parseEther("0.7"));
    });

    it("입찰 취소 시 이벤트가 발생해야 한다", async function () {
      const tx = await fundit.connect(insuranceCompany1).placeBid(
        proposalId,
        ethers.parseEther("0.8"),
        ethers.parseEther("8"),
        "테스트 보장 조건",
        3 * 24 * 60 * 60
      );
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      const bidId = event ? BigInt(event.topics[1]) : 0n;

      await expect(
        fundit.connect(insuranceCompany1).cancelBid(bidId)
      )
        .to.emit(fundit, "BidCancelled")
        .withArgs(bidId, insuranceCompany1.address);
    });
  });
}); 