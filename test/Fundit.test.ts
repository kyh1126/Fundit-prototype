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
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { fundit, owner } = await loadFixture(deployFixture);
      const ownerAddress = await fundit.read.owner();
      expect(ownerAddress).to.equal(owner);
    });
    
    it("Should set the FunditToken contract", async function () {
      const { fundit, funditToken } = await loadFixture(deployFixture);
      const tokenAddress = await fundit.read.funditToken();
      expect(tokenAddress).to.equal(funditToken.address);
    });
  });

  describe("Proposal", function () {
    it("Should create a proposal", async function () {
      const { fundit, publicClient, owner, title, description, premium, coverage, duration } = await loadFixture(deployFixture);
      
      const hash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      const proposalId = BigInt(receipt.logs[0].topics[1] as `0x${string}`);
      const proposal = await fundit.read.getProposal([proposalId]) as [bigint, Address, string, string, bigint, bigint, bigint, boolean, boolean];
      
      expect(proposal[0]).to.equal(proposalId);
      expect(proposal[1]).to.equal(owner);
      expect(proposal[2]).to.equal(title);
      expect(proposal[3]).to.equal(description);
      expect(proposal[4]).to.equal(premium);
      expect(proposal[5]).to.equal(coverage);
      expect(proposal[7]).to.be.true;
      expect(proposal[8]).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      const { fundit, addr1 } = await loadFixture(deployFixture);
      await expect(fundit.write.pause([], { account: addr1 }))
        .to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("Bid", function () {
    it("Should allow insurance company to place bid", async function () {
      const { fundit, publicClient, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      const bid = await fundit.read.getBid([bidId]) as [bigint, bigint, Address, bigint, bigint, string, boolean];
      expect(bid[0]).to.equal(bidId);
      expect(bid[1]).to.equal(proposalId);
      expect(bid[2]).to.equal(addr1);
      expect(bid[3]).to.equal(bidPrem);
      expect(bid[4]).to.equal(bidCov);
      expect(bid[5]).to.equal(terms);
      expect(bid[6]).to.be.true;
    });

    it("Should not allow non-insurance company to place bid", async function () {
      const { fundit, publicClient, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Try to place bid without registration
      await expect(fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 }))
        .to.be.rejectedWith("Not registered insurance company");
    });
  });

  describe("Contract", function () {
    it("Should create contract from bid", async function () {
      const { fundit, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      const contract = await fundit.read.getContract([contractId]) as [bigint, bigint, bigint, Address, Address, bigint, bigint, string, bigint, bigint, boolean, boolean];
      expect(contract[0]).to.equal(contractId);
      expect(contract[1]).to.equal(proposalId);
      expect(contract[2]).to.equal(bidId);
      expect(contract[3]).to.equal(owner);
      expect(contract[4]).to.equal(addr1);
      expect(contract[5]).to.equal(bidPrem);
      expect(contract[6]).to.equal(bidCov);
      expect(contract[7]).to.equal(terms);
      expect(contract[9]).to.equal(contract[8] + contractDuration);
      expect(contract[10]).to.be.true;
      expect(contract[11]).to.be.false;
    });

    it("Should not allow non-proposer to create contract", async function () {
      const { fundit, publicClient, addr1, addr2, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Try to create contract with non-proposer
      await expect(fundit.write.createContract([proposalId, bidId, contractDuration], { account: addr2 }))
        .to.be.rejectedWith("Not proposal owner");
    });
  });
  
  describe("Claims", function () {
    it("Should allow contract owner to submit a claim", async function () {
      const { fundit, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Submit claim
      const claimAmount = BigInt(5000);
      await fundit.write.submitClaim([contractId, "Test claim", claimAmount]);
      
      // Check claim amount
      const storedClaimAmount = await fundit.read.claimAmounts([contractId]);
      expect(storedClaimAmount).to.equal(claimAmount);
    });
    
    it("Should not allow non-contract owner to submit a claim", async function () {
      const { fundit, publicClient, owner, addr1, addr2, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Try to submit claim with non-contract owner
      const claimAmount = BigInt(5000);
      await expect(fundit.write.submitClaim([contractId, "Test claim", claimAmount], { account: addr2 }))
        .to.be.rejectedWith("Not contract owner");
    });
    
    it("Should process a claim", async function () {
      const { fundit, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Submit claim
      const claimAmount = BigInt(5000);
      await fundit.write.submitClaim([contractId, "Test claim", claimAmount]);
      
      // Set oracle for contract
      const dummyOracleAddress = "0x0000000000000000000000000000000000000001";
      await fundit.write.setContractOracle([contractId, dummyOracleAddress]);
      
      // Process claim
      const dummyRequestId = "0x0000000000000000000000000000000000000000000000000000000000000001";
      await fundit.write.processClaim([contractId, dummyRequestId]);
      
      // Check claim processed
      const claimProcessed = await fundit.read.claimsProcessed([contractId]);
      expect(claimProcessed).to.be.true;
      
      // Check claim approved
      const claimApproved = await fundit.read.claimsApproved([contractId]);
      expect(claimApproved).to.be.true;
    });
  });
  
  describe("Reviews", function () {
    it("Should allow contract owner to submit a review", async function () {
      const { fundit, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Submit review
      const reviewContent = "Great insurance experience! The claim process was smooth and the coverage was exactly what I needed.";
      const rating = BigInt(5);
      await fundit.write.submitReview([contractId, reviewContent, rating]);
      
      // Check review
      const review = await fundit.read.getReview([contractId]);
      expect(review.contractId).to.equal(contractId);
      expect(review.reviewer).to.equal(owner);
      expect(review.content).to.equal(reviewContent);
      expect(review.rating).to.equal(rating);
      expect(review.exists).to.be.true;
    });
    
    it("Should not allow non-contract owner to submit a review", async function () {
      const { fundit, publicClient, owner, addr1, addr2, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Try to submit review with non-contract owner
      const reviewContent = "Great insurance experience!";
      const rating = BigInt(5);
      await expect(fundit.write.submitReview([contractId, reviewContent, rating], { account: addr2 }))
        .to.be.rejectedWith("Not contract owner");
    });
    
    it("Should reward user with tokens for submitting a review", async function () {
      const { fundit, funditToken, publicClient, owner, addr1, title, description, premium, coverage, duration, bidPremium: bidPrem, bidCoverage: bidCov, terms, contractDuration } = await loadFixture(deployFixture);
      
      // Create proposal
      const proposeTxHash = await fundit.write.proposeInsurance([title, description, premium, coverage, duration]);
      const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeTxHash });
      const proposalId = BigInt(proposeReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Register insurance company
      await fundit.write.registerInsuranceCompany([], { account: addr1 });
      
      // Place bid
      const bidTxHash = await fundit.write.placeBid([proposalId, bidPrem, bidCov, terms], { account: addr1 });
      const bidReceipt = await publicClient.waitForTransactionReceipt({ hash: bidTxHash });
      const bidId = BigInt(bidReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Create contract
      const contractTxHash = await fundit.write.createContract([proposalId, bidId, contractDuration]);
      const contractReceipt = await publicClient.waitForTransactionReceipt({ hash: contractTxHash });
      const contractId = BigInt(contractReceipt.logs[0].topics[1] as `0x${string}`);
      
      // Get initial token balance
      const initialBalance = await funditToken.read.balanceOf([owner]);
      
      // Submit review
      const reviewContent = "Great insurance experience! The claim process was smooth and the coverage was exactly what I needed. The insurance company was responsive and professional throughout the entire process. I would definitely recommend this service to others.";
      const rating = BigInt(5);
      await fundit.write.submitReview([contractId, reviewContent, rating]);
      
      // Check token balance increased
      const finalBalance = await funditToken.read.balanceOf([owner]);
      expect(finalBalance).to.be.gt(initialBalance);
      
      // Check review score
      const reviewScore = await funditToken.read.getUserReviewScore([owner]);
      expect(reviewScore).to.be.gt(BigInt(0));
    });
  });
}); 