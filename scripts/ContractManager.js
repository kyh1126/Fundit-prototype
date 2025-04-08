const { ethers } = require("ethers");
const { abi } = require("../artifacts/contracts/Fundit.sol/Fundit.json");
const { abi: tokenAbi } = require("../artifacts/contracts/FunditToken.sol/FunditToken.json");

require("dotenv").config();

class ContractManager {
  constructor(contractAddress, tokenAddress) {
    this.contractAddress = contractAddress;
    this.tokenAddress = tokenAddress;
    this.provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    this.signer = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY, this.provider);
    this.writeContract = new ethers.Contract(contractAddress, abi, this.signer);
    this.contract = new ethers.Contract(contractAddress, abi, this.provider);
    
    if (tokenAddress) {
      this.tokenContract = new ethers.Contract(tokenAddress, tokenAbi, this.provider);
      this.writeTokenContract = new ethers.Contract(tokenAddress, tokenAbi, this.signer);
    }
  }

  async transferOwnership(newOwner) {
    try {
      console.log(`Transferring ownership to ${newOwner}...`);
      const tx = await this.contract.transferOwnership(newOwner);
      await tx.wait();
      console.log("Ownership transferred");
    } catch (error) {
      console.error("Error in transferOwnership:", error);
    }
  }

  async proposeInsurance(title, description, premium, coverage, duration) {
    try {
      console.log(`Proposing insurance with title: ${title}`);
      const tx = await this.writeContract.proposeInsurance(title, description, premium, coverage, duration);
      await tx.wait();
      console.log("Insurance proposed");
    } catch (error) {
      console.error("Error in proposeInsurance:", error);
    }
  }

  async getOwner() {
    try {
      const owner = await this.contract.owner();
      console.log("Current Owner:", owner);
      return owner;
    } catch (error) {
      console.error("Error in getOwner:", error);
    }
  }

  async getProposal(proposalId) {
    try {
      const proposal = await this.contract.getProposal(proposalId);
      console.log("Proposal:", proposal);
      return proposal;
    } catch (error) {
      console.error("Error in getProposal:", error);
    }
  }
  
  async submitClaim(contractId, description, amount) {
    try {
      console.log(`Submitting claim for contract ${contractId} with amount ${amount}`);
      const tx = await this.writeContract.submitClaim(contractId, description, amount);
      await tx.wait();
      console.log("Claim submitted");
    } catch (error) {
      console.error("Error in submitClaim:", error);
    }
  }
  
  async processClaim(contractId, requestId) {
    try {
      console.log(`Processing claim for contract ${contractId}`);
      const tx = await this.writeContract.processClaim(contractId, requestId);
      await tx.wait();
      console.log("Claim processed");
    } catch (error) {
      console.error("Error in processClaim:", error);
    }
  }
  
  async submitReview(contractId, content, rating) {
    try {
      console.log(`Submitting review for contract ${contractId} with rating ${rating}`);
      const tx = await this.writeContract.submitReview(contractId, content, rating);
      await tx.wait();
      console.log("Review submitted");
    } catch (error) {
      console.error("Error in submitReview:", error);
    }
  }
  
  async getReview(contractId) {
    try {
      const review = await this.contract.getReview(contractId);
      console.log("Review:", review);
      return review;
    } catch (error) {
      console.error("Error in getReview:", error);
    }
  }
  
  async getTokenBalance(address) {
    try {
      if (!this.tokenContract) {
        console.error("Token contract not set");
        return;
      }
      
      const balance = await this.tokenContract.balanceOf(address);
      console.log(`Token balance for ${address}: ${balance}`);
      return balance;
    } catch (error) {
      console.error("Error in getTokenBalance:", error);
    }
  }
  
  async getUserReviewScore(address) {
    try {
      if (!this.tokenContract) {
        console.error("Token contract not set");
        return;
      }
      
      const score = await this.tokenContract.getUserReviewScore(address);
      console.log(`Review score for ${address}: ${score}`);
      return score;
    } catch (error) {
      console.error("Error in getUserReviewScore:", error);
    }
  }
}

module.exports = ContractManager;
