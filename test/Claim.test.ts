import { expect } from "chai";
import { ethers } from "hardhat";
import { Fundit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("보험금 청구", function () {
  let fundit: Fundit;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let otherUser: SignerWithAddress;
  let contractId: bigint;

  beforeEach(async function () {
    [owner, user, otherUser] = await ethers.getSigners();

    const Fundit = await ethers.getContractFactory("Fundit");
    fundit = await Fundit.deploy();
    await fundit.waitForDeployment();

    // 보험사 등록
    await fundit.connect(otherUser).registerInsuranceCompany();

    // 제안 생성
    await fundit.connect(user).proposeInsurance(
      "테스트 제안",
      "테스트 설명",
      ethers.parseEther("1"),
      ethers.parseEther("10"),
      86400 // 1일 = 86400초
    );

    // 입찰
    const proposalId = 1n;
    await fundit.connect(otherUser).placeBid(
      proposalId,
      ethers.parseEther("1"),
      ethers.parseEther("10"),
      "테스트 조건"
    );

    // 입찰 수락
    const bidId = 1n;
    const tx = await fundit.connect(user).acceptBid(
      proposalId,
      bidId
    );
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction receipt is null");
    const event = receipt.logs[0];
    if (!event || !('args' in event)) throw new Error("Event args not found");
    contractId = event.args[0];
  });

  it("계약 소유자는 청구를 제출할 수 있어야 합니다", async () => {
    const tx = await fundit.connect(user).submitClaim(
      contractId,
      ethers.parseEther("1"),
      "테스트 청구",
      "테스트 증거"
    );
    await tx.wait();

    const [amount, description, evidences, timestamp, processed, approved, verificationCount, rejectionCount] = 
      await fundit.getClaimInfo(contractId);
    
    expect(amount).to.equal(ethers.parseEther("1"));
    expect(description).to.equal("테스트 청구");
    expect(evidences[0]).to.equal("테스트 증거");
    expect(processed).to.be.false;
  });

  it("계약 소유자가 아닌 사용자는 청구를 제출할 수 없습니다", async function () {
    await expect(
      fundit.connect(otherUser).submitClaim(
        contractId,
        BigInt(1e18),
        "Test Description",
        "Test Evidence"
      )
    ).to.be.revertedWith("Only proposer can submit claim");
  });

  it("존재하지 않는 계약에 대한 청구는 제출할 수 없습니다", async function () {
    await expect(
      fundit.connect(user).submitClaim(
        999n,
        BigInt(1e18),
        "Test Description",
        "Test Evidence"
      )
    ).to.be.revertedWith("Contract does not exist");
  });

  it("이미 청구가 제출된 계약에는 다시 청구를 제출할 수 없습니다", async function () {
    await fundit.connect(user).submitClaim(
      contractId,
      BigInt(1e18),
      "Test Description",
      "Test Evidence"
    );

    await expect(
      fundit.connect(user).submitClaim(
        contractId,
        BigInt(1e18),
        "Test Description",
        "Test Evidence"
      )
    ).to.be.revertedWith("Claim already submitted");
  });

  it("청구 금액이 보상 한도를 초과할 수 없습니다", async function () {
    await expect(
      fundit.connect(user).submitClaim(
        contractId,
        BigInt(11e18),
        "Test Description",
        "Test Evidence"
      )
    ).to.be.revertedWith("Amount exceeds coverage");
  });

  it("음수 금액으로 청구할 수 없습니다", async function () {
    await expect(
      fundit.connect(user).submitClaim(
        contractId,
        0n,
        "Test Description",
        "Test Evidence"
      )
    ).to.be.revertedWith("Amount must be greater than 0");
  });
}); 