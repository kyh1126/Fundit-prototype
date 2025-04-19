import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFunditFixture } from "./fixtures/deployFunditFixture";
import { createProposal } from "./fixtures";
import { Fundit } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Bid", function () {
    let fundit: Fundit;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let insuranceCompany: SignerWithAddress;
    let otherUser: SignerWithAddress;
    let proposalId: bigint;

    beforeEach(async function () {
        [owner, user, insuranceCompany, otherUser] = await ethers.getSigners();

        const Fundit = await ethers.getContractFactory("Fundit");
        fundit = await Fundit.deploy();
        await fundit.waitForDeployment();

        // 보험사 등록
        await fundit.connect(insuranceCompany).registerInsuranceCompany();

        // 제안 생성
        await fundit.connect(user).proposeInsurance(
            "테스트 제안",
            "테스트 설명",
            ethers.parseEther("1"),
            ethers.parseEther("10"),
            86400 // 1일 = 86400초
        );

        proposalId = 1n;
    });

    it("등록된 보험사는 입찰할 수 있어야 합니다", async () => {
        const tx = await fundit.connect(insuranceCompany).placeBid(
            proposalId,
            ethers.parseEther("1"),
            ethers.parseEther("10"),
            "테스트 조건"
        );
        await tx.wait();

        const bidId = 1n;
        const [id, proposalId_, insurer, premium, coverage, terms, active] = await fundit.getBid(proposalId, bidId);
        expect(insurer).to.equal(insuranceCompany.address);
        expect(premium).to.equal(ethers.parseEther("1"));
        expect(coverage).to.equal(ethers.parseEther("10"));
        expect(terms).to.equal("테스트 조건");
        expect(active).to.be.true;
    });

    it("등록되지 않은 보험사는 입찰할 수 없습니다", async function () {
        await expect(
            fundit.connect(otherUser).placeBid(
                proposalId,
                BigInt(1e18),
                BigInt(10e18),
                "Test Terms"
            )
        ).to.be.revertedWith("Only registered insurance company can place bid");
    });

    it("입찰을 수정할 수 있어야 합니다", async () => {
        await fundit.connect(insuranceCompany).placeBid(
            proposalId,
            ethers.parseEther("1"),
            ethers.parseEther("10"),
            "테스트 조건"
        );

        const bidId = 1n;
        await fundit.connect(insuranceCompany).modifyBid(
            proposalId,
            bidId,
            ethers.parseEther("2"),
            ethers.parseEther("20"),
            "수정된 조건"
        );

        const [id, proposalId_, insurer, premium, coverage, terms, active] = await fundit.getBid(proposalId, bidId);
        expect(premium).to.equal(ethers.parseEther("2"));
        expect(coverage).to.equal(ethers.parseEther("20"));
        expect(terms).to.equal("수정된 조건");
    });

    it("입찰을 취소할 수 있어야 합니다", async () => {
        await fundit.connect(insuranceCompany).placeBid(
            proposalId,
            ethers.parseEther("1"),
            ethers.parseEther("10"),
            "테스트 조건"
        );

        const bidId = 1n;
        await fundit.connect(insuranceCompany).cancelBid(proposalId, bidId);

        const [id, proposalId_, insurer, premium, coverage, terms, active] = await fundit.getBid(proposalId, bidId);
        expect(active).to.be.false;
    });

    it("제안에 대한 모든 입찰을 조회할 수 있어야 합니다", async () => {
        await fundit.connect(insuranceCompany).placeBid(
            proposalId,
            ethers.parseEther("1"),
            ethers.parseEther("10"),
            "테스트 조건 1"
        );

        await fundit.connect(insuranceCompany).placeBid(
            proposalId,
            ethers.parseEther("2"),
            ethers.parseEther("20"),
            "테스트 조건 2"
        );

        const bids = await fundit.getBids(proposalId);
        expect(bids.length).to.equal(2);
        expect(bids[0].insurer).to.equal(insuranceCompany.address);
        expect(bids[1].insurer).to.equal(insuranceCompany.address);
    });
}); 