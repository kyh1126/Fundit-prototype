import { expect } from "chai";
import { ethers } from "hardhat";
import { setupTest } from "./fixtures";
import type { Fundit } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ContractTransactionReceipt, Log } from "ethers";

interface TestSetup {
  fundit: Fundit;
  user: HardhatEthersSigner;
  insuranceCompany: HardhatEthersSigner;
  oracle: HardhatEthersSigner;
}

/**
 * Proposal 컨트랙트 테스트
 * - 보험 상품 제안 생성
 * - 제안 정보 저장
 * - 제안 취소
 * - 잘못된 입력값 처리
 * - 제안 마감일 지난 경우
 */

describe("Proposal", function () {
  let fundit: Fundit;
  let user: HardhatEthersSigner;
  let insuranceCompany: HardhatEthersSigner;
  let otherUser: HardhatEthersSigner;
  let proposalId: bigint;

  beforeEach(async function () {
    const { fundit: f, user: u, insuranceCompany: ic, oracle } = await setupTest();
    fundit = f;
    user = u;
    insuranceCompany = ic;
    otherUser = oracle;

    // Create proposal
    const tx = await fundit.connect(user).proposeInsurance(
      "Test Proposal",
      "Test Description",
      BigInt(1e18), // 1 ETH
      BigInt(10e18), // 10 ETH
      86400n // 1 day
    );
    const receipt = await tx.wait();
    if (receipt) {
      const logs = receipt.logs;
      const event = logs.find((log: Log) => {
        try {
          const parsedLog = fundit.interface.parseLog(log);
          return parsedLog?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      if (event) {
        const parsedLog = fundit.interface.parseLog(event);
        if (parsedLog && parsedLog.args) {
          proposalId = parsedLog.args[0];
        }
      }
    }
  });

  describe("proposeInsurance", function () {
    it("should create a new proposal", async function () {
      const proposal = await fundit.getProposal(proposalId);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.description).to.equal("Test Description");
      expect(proposal.premium).to.equal(BigInt(1e18));
      expect(proposal.coverage).to.equal(BigInt(10e18));
      expect(proposal.duration).to.equal(86400n);
      expect(proposal.proposer).to.equal(user.address);
      expect(proposal.active).to.equal(true);
    });

    it("should not allow zero premium", async function () {
      await expect(
        fundit.connect(user).proposeInsurance(
          "Test Proposal",
          "Test Description",
          0n,
          BigInt(10e18),
          86400n
        )
      ).to.be.revertedWith("Premium must be greater than 0");
    });

    it("should not allow zero coverage", async function () {
      await expect(
        fundit.connect(user).proposeInsurance(
          "Test Proposal",
          "Test Description",
          BigInt(1e18),
          0n,
          86400n
        )
      ).to.be.revertedWith("Coverage must be greater than 0");
    });

    it("should not allow zero duration", async function () {
      await expect(
        fundit.connect(user).proposeInsurance(
          "Test Proposal",
          "Test Description",
          BigInt(1e18),
          BigInt(10e18),
          0n
        )
      ).to.be.revertedWith("Duration must be greater than minimum allowed");
    });

    it("should not allow empty title", async function () {
      await expect(
        fundit.connect(user).proposeInsurance(
          "",
          "Test Description",
          BigInt(1e18),
          BigInt(10e18),
          86400n
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("should not allow empty description", async function () {
      await expect(
        fundit.connect(user).proposeInsurance(
          "Test Proposal",
          "",
          BigInt(1e18),
          BigInt(10e18),
          86400n
        )
      ).to.be.revertedWith("Description cannot be empty");
    });
  });

  describe("cancelProposal", function () {
    it("should allow proposal owner to cancel proposal", async function () {
      await expect(fundit.connect(user).cancelProposal(proposalId))
        .to.emit(fundit, "ProposalCancelled")
        .withArgs(proposalId, user.address);
    });

    it("should not allow non-proposal owner to cancel proposal", async function () {
      await expect(fundit.connect(otherUser).cancelProposal(proposalId))
        .to.be.revertedWith("Only proposer can cancel proposal");
    });

    it("should not allow cancelling non-existent proposal", async function () {
      await expect(fundit.connect(user).cancelProposal(999n))
        .to.be.revertedWith("Proposal does not exist");
    });

    it("should not allow cancelling proposal with bids", async function () {
      await fundit.connect(insuranceCompany).placeBid(
        proposalId,
        BigInt(1e18),
        BigInt(10e18),
        "Test Terms"
      );

      await expect(fundit.connect(user).cancelProposal(proposalId))
        .to.be.revertedWith("Cannot cancel proposal with bids");
    });
  });

  describe("getProposal", function () {
    it("should return proposal information", async function () {
      const proposal = await fundit.getProposal(proposalId);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.description).to.equal("Test Description");
      expect(proposal.premium).to.equal(BigInt(1e18));
      expect(proposal.coverage).to.equal(BigInt(10e18));
      expect(proposal.duration).to.equal(86400n);
      expect(proposal.proposer).to.equal(user.address);
      expect(proposal.active).to.equal(true);
    });

    it("should revert for non-existent proposal", async function () {
      await expect(
        fundit.getProposal(999n)
      ).to.be.revertedWith("Proposal does not exist");
    });
  });
}); 