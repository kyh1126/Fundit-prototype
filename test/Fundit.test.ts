import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { getAddress, Address, PublicClient, WalletClient } from "viem";
import hre from "hardhat";
import { ethers } from "ethers";
import type { Fundit } from "../typechain-types";
import type { FunditToken } from "../typechain-types";

interface TestFixture {
  fundit: Awaited<ReturnType<typeof hre.viem.deployContract>>;
  funditToken: Awaited<ReturnType<typeof hre.viem.deployContract>>;
  publicClient: PublicClient;
  owner: Address;
  addr1: Address;
  addr2: Address;
  addr3: Address;
  title: string;
  description: string;
  premium: bigint;
  coverage: bigint;
  duration: bigint;
  bidPremium: bigint;
  bidCoverage: bigint;
  terms: string;
  contractDuration: bigint;
}

async function deployFixture(): Promise<TestFixture> {
  const publicClient = await hre.viem.getPublicClient();
  const walletClients = await hre.viem.getWalletClients();
  const [owner, addr1, addr2, addr3] = walletClients.map(client => client.account.address);
  
  // FunditToken 배포
  const funditToken = await hre.viem.deployContract("FunditToken");
  
  // Fundit 배포
  const fundit = await hre.viem.deployContract("Fundit");
  
  // Fundit에 FunditToken 설정
  await fundit.write.setFunditToken([funditToken.address]);

  return {
    fundit,
    funditToken,
    publicClient,
    owner,
    addr1,
    addr2,
    addr3,
    title: "Test Insurance",
    description: "Test Description",
    premium: BigInt(1000),
    coverage: BigInt(10000),
    duration: BigInt(7 * 24 * 60 * 60), // 7일
    bidPremium: BigInt(900),
    bidCoverage: BigInt(9000),
    terms: "Test Terms",
    contractDuration: BigInt(30 * 24 * 60 * 60), // 30일
  };
}

describe("Fundit", function () {
  describe("배포", function () {
    it("소유자가 올바르게 설정되어야 합니다", async function () {
      const { fundit, owner } = await loadFixture(deployFixture);
      const ownerAddress = await fundit.read.owner() as string;
      expect(getAddress(ownerAddress).toLowerCase()).to.equal(getAddress(owner).toLowerCase());
    });
    
    it("FunditToken 컨트랙트가 올바르게 설정되어야 합니다", async function () {
      const { fundit, funditToken } = await loadFixture(deployFixture);
      const tokenAddress = await fundit.read.funditToken() as string;
      expect(getAddress(tokenAddress).toLowerCase()).to.equal(getAddress(funditToken.address).toLowerCase());
    });
  });

  describe("제안", function () {
    it("보험 상품 제안이 생성되어야 합니다", async function () {
      const { fundit, publicClient, owner, title, description, premium, coverage, duration } = await loadFixture(deployFixture);
      
      const hash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      const proposalId = BigInt(receipt.logs[0].topics[1] as `0x${string}`);
      const proposal = await fundit.read.getProposal([proposalId]) as [bigint, Address, string, string, bigint, bigint, bigint, boolean, boolean];
      
      expect(proposal[0]).to.equal(proposalId);
      expect(getAddress(proposal[1]).toLowerCase()).to.equal(getAddress(owner).toLowerCase());
      expect(proposal[2]).to.equal(title);
      expect(proposal[3]).to.equal(description);
      expect(proposal[4]).to.equal(premium);
      expect(proposal[5]).to.equal(coverage);
      expect(proposal[7]).to.be.true;
      expect(proposal[8]).to.be.false;
    });

    it("소유자만 일시 중지할 수 있어야 합니다", async function () {
      const { fundit, addr1 } = await loadFixture(deployFixture);
      await expect(fundit.write.pause([], { account: addr1 }))
        .to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("입찰", function () {
    it("보험사가 입찰할 수 있어야 합니다", async function () {
      const { fundit, publicClient, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms } = await loadFixture(deployFixture);
      
      // 제안 생성
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 보험사 등록
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // 입찰
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      const bid = await fundit.read.getBid([bidId]) as [bigint, bigint, Address, bigint, bigint, string, boolean];
      expect(bid[0]).to.equal(bidId);
      expect(bid[1]).to.equal(proposalId);
      expect(getAddress(bid[2]).toLowerCase()).to.equal(getAddress(addr1).toLowerCase());
      expect(bid[3]).to.equal(bidPrem);
      expect(bid[4]).to.equal(bidCov);
      expect(bid[5]).to.equal(terms);
      expect(bid[6]).to.be.true;
    });

    it("등록되지 않은 보험사는 입찰할 수 없어야 합니다", async function () {
      const { fundit, publicClient, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms } = await loadFixture(deployFixture);
      
      // 제안 생성
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 등록 없이 입찰 시도
      await expect(fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 }))
        .to.be.rejectedWith("Not registered insurance company");
    });
  });

  describe("계약", function () {
    it("입찰로부터 계약이 생성되어야 합니다", async function () {
      const { fundit, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // 제안 생성
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 보험사 등록
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // 입찰
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 계약 생성
      const contractTxHash = await fundit.write.acceptBid([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      const contract = await fundit.read.getContract([contractId]) as [bigint, bigint, bigint, Address, Address, bigint, bigint, string, bigint, bigint, number, boolean];
      expect(contract[0]).to.equal(contractId);
      expect(contract[1]).to.equal(proposalId);
      expect(contract[2]).to.equal(bidId);
      expect(getAddress(contract[3]).toLowerCase()).to.equal(getAddress(owner).toLowerCase());
      expect(getAddress(contract[4]).toLowerCase()).to.equal(getAddress(addr1).toLowerCase());
      expect(contract[5]).to.equal(bidPrem);
      expect(contract[6]).to.equal(bidCov);
      expect(contract[7]).to.equal(terms);
      expect(contract[9]).to.equal(contract[8] + contractDuration);
      expect(contract[10]).to.equal(1); // ContractStatus.Active
      expect(contract[11]).to.be.false;
    });

    it("제안자가 아닌 사용자는 계약을 생성할 수 없어야 합니다", async function () {
      const { fundit, publicClient, addr1, addr2, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // 제안 생성
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 보험사 등록
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // 입찰
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // 제안자가 아닌 사용자가 계약 생성 시도
      await expect(fundit.write.acceptBid([proposalId, bidId, contractDuration], { account: addr2 }))
        .to.be.rejectedWith("Not proposal owner");
    });
  });
  
  describe("청구", function () {
    it("청구가 올바르게 제출되고 처리되어야 합니다", async function () {
      const { fundit, owner, addr1, addr2, addr3, publicClient } = await loadFixture(deployFixture);
      
      // 제안 생성 및 보험사 등록
      const title = "테스트 보험";
      const description = "테스트 설명";
      const premium = BigInt(1000);
      const coverage = BigInt(10000);
      const duration = BigInt(7 * 24 * 60 * 60); // 7일 (초)
      
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // 입찰 및 계약 생성
      const bidPremium = BigInt(900);
      const bidCoverage = BigInt(9000);
      const terms = "테스트 조건";
      const contractDuration = BigInt(30 * 24 * 60 * 60); // 30일 (초)
      
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPremium, bidCoverage, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      const contractTxHash = await fundit.write.acceptBid([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Oracle 등록 및 설정
      await fundit.write.registerOracle([addr2]);
      await fundit.write.setContractOracle([contractId, addr2]);
      
      // 청구 제출
      const claimDescription = "상세한 청구 설명입니다. 이 설명은 최소 길이 요구사항을 충족합니다. 이는 발생한 사고와 보상이 필요한 이유를 설명합니다. 사고는 특정 날짜와 시간에 발생했으며, 보험 대상물에 상당한 피해를 입혔습니다. 여기에는 발생한 사고의 구체적인 내용과 보험 보장과의 관련성이 포함되어 있습니다...";
      const claimEvidence = "초기 청구 증거입니다. 이 증거는 최소 길이 요구사항을 충족합니다. 여기에는 사진, 문서 및 기타 지원 자료가 포함되어 있습니다. 증거는 발생한 피해와 보험 정책에 따라 보장되는 내용을 명확하게 보여줍니다. 구체적인 증거는 다음과 같습니다: 1. 여러 각도에서 촬영한 피해 사진, 2. 세 명의 다른 계약자가 작성한 상세한 수리 견적서, 3. 사고를 기록한 경찰 보고서, 4. 사고를 목격한 증인의 진술서...";
      await fundit.write.submitClaim([contractId, claimDescription, bidCoverage / BigInt(2), claimEvidence]);
      
      // Oracle 검증
      const oracleEvidence = "Oracle의 검증 증거입니다. 이 증거는 최소 길이 요구사항을 충족합니다. 제출된 모든 자료를 철저히 조사하고 검토한 결과, 다음과 같은 사항을 확인했습니다: 1. 사고가 설명대로 발생했음, 2. 피해가 보고된 원인과 일치함, 3. 수리 견적이 적절하고 합리적임, 4. 청구 금액이 정책 한도 내에 있음, 5. 모든 문서가 진본이고 검증 가능함...";
      
      // 첫 번째 Oracle 검증
      await fundit.write.submitOracleVerification([contractId, true, oracleEvidence], { account: addr2 });
      
      // 두 번째 Oracle 등록 및 설정
      await fundit.write.registerOracle([addr3]);
      await fundit.write.setContractOracle([contractId, addr3]);
      
      // 두 번째 Oracle 검증
      await fundit.write.submitOracleVerification([contractId, true, oracleEvidence], { account: addr3 });
      
      // 세 번째 Oracle 등록 및 설정
      await fundit.write.registerOracle([addr1]);
      await fundit.write.setContractOracle([contractId, addr1]);
      
      // 세 번째 Oracle 검증
      await fundit.write.submitOracleVerification([contractId, true, oracleEvidence], { account: addr1 });
      
      // 청구 처리 확인
      const claimProcessed = await fundit.read.claimsProcessed([contractId]) as boolean;
      const claimApproved = await fundit.read.claimsApproved([contractId]) as boolean;
      
      expect(claimProcessed).to.be.true;
      expect(claimApproved).to.be.true;
    });
  });
  
  describe("리뷰", function () {
    it("리뷰가 올바르게 제출되어야 합니다", async function () {
      const { fundit, owner, addr1, publicClient } = await loadFixture(deployFixture);
      
      // 제안 및 계약 생성
      const title = "테스트 보험";
      const description = "테스트 설명";
      const premium = BigInt(1000);
      const coverage = BigInt(10000);
      const duration = BigInt(7 * 24 * 60 * 60); // 7일 (초)
      const bidPremium = BigInt(900);
      const bidCoverage = BigInt(9000);
      const terms = "테스트 조건";
      const contractDuration = BigInt(30 * 24 * 60 * 60); // 30일 (초)
      
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPremium, bidCoverage, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      await fundit.write.acceptBid([proposalId, bidId, contractDuration]);
      
      // 리뷰 제출
      const reviewContent = "이것은 보험 서비스에 대한 상세한 리뷰입니다. 청구 절차가 매우 매끄럽고 효율적이었습니다.";
      const rating = BigInt(5);
      await fundit.write.submitReview([proposalId, reviewContent, rating], { account: owner });
      
      // 리뷰 존재 확인
      const reviewExists = await fundit.read.hasReview([proposalId]) as boolean;
      expect(reviewExists).to.be.true;
    });
  });
  
  describe("토큰 보상", function () {
    it("리뷰 제출 시 사용자에게 토큰이 보상되어야 합니다", async function () {
      const { fundit, funditToken, owner, addr1, publicClient } = await loadFixture(deployFixture);
      
      // 제안 및 계약 생성
      const title = "테스트 보험";
      const description = "테스트 설명";
      const premium = BigInt(1000);
      const coverage = BigInt(10000);
      const duration = BigInt(7 * 24 * 60 * 60); // 7일 (초)
      const bidPremium = BigInt(900);
      const bidCoverage = BigInt(9000);
      const terms = "테스트 조건";
      const contractDuration = BigInt(30 * 24 * 60 * 60); // 30일 (초)
      
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPremium, bidCoverage, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      await fundit.write.acceptBid([proposalId, bidId, contractDuration]);
      
      // 초기 토큰 잔액 확인
      const initialBalance = await funditToken.read.balanceOf([owner]) as bigint;
      
      // 리뷰 제출
      const reviewContent = "이것은 보험 서비스에 대한 상세한 리뷰입니다. 청구 절차가 매우 매끄럽고 효율적이었습니다.";
      const rating = BigInt(5);
      await fundit.write.submitReview([proposalId, reviewContent, rating], { account: owner });
      
      // 토큰 잔액 증가 확인
      const finalBalance = await funditToken.read.balanceOf([owner]) as bigint;
      expect(finalBalance > initialBalance).to.be.true;
    });
  });
}); 