const { ethers } = require("hardhat");
const FUNDIT_ABI = require("../artifacts/contracts/Fundit.sol/Fundit.json").abi;
const FUNDIT_TOKEN_ABI = require("../artifacts/contracts/FunditToken.sol/FunditToken.json").abi;

/**
 * @class ContractManager
 * @description Fundit 컨트랙트와 상호작용하기 위한 관리자 클래스
 */
class ContractManager {
    /**
     * @constructor
     * @param {string} contractAddress - Fundit 컨트랙트 주소
     * @param {string} tokenAddress - FunditToken 컨트랙트 주소
     */
    constructor(contractAddress, tokenAddress) {
        this.contractAddress = contractAddress;
        this.tokenAddress = tokenAddress;
        this.contract = null;
        this.tokenContract = null;
    }

    /**
     * @description 컨트랙트 초기화
     */
    async initialize() {
        const [signer] = await ethers.getSigners();
        this.contract = new ethers.Contract(this.contractAddress, FUNDIT_ABI, signer);
        this.tokenContract = new ethers.Contract(this.tokenAddress, FUNDIT_TOKEN_ABI, signer);
    }

    /**
     * @description 보험 제안 생성
     * @param {string} title - 제안 제목
     * @param {string} description - 제안 설명
     * @param {string} premium - 보험료
     * @param {string} coverage - 보상금
     * @param {number} duration - 보험 기간
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async proposeInsurance(title, description, premium, coverage, duration) {
        try {
            const tx = await this.contract.proposeInsurance(
                title,
                description,
                ethers.parseEther(premium),
                ethers.parseEther(coverage),
                duration
            );
            const receipt = await tx.wait();
            console.log("보험 제안이 생성되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("보험 제안 생성 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 제안 조회
     * @param {number} proposalId - 제안 ID
     * @returns {Promise<Object>} 제안 정보
     */
    async getProposal(proposalId) {
        try {
            const proposal = await this.contract.getProposal(proposalId);
            return {
                title: proposal.title,
                description: proposal.description,
                premium: ethers.formatEther(proposal.premium),
                coverage: ethers.formatEther(proposal.coverage),
                duration: proposal.duration.toString(),
                proposer: proposal.proposer,
                isActive: proposal.isActive,
                createdAt: new Date(proposal.createdAt * 1000).toISOString()
            };
        } catch (error) {
            console.error("제안 조회 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 입찰 제출
     * @param {number} proposalId - 제안 ID
     * @param {string} amount - 입찰 금액
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async placeBid(proposalId, amount) {
        try {
            const tx = await this.contract.placeBid(proposalId, ethers.parseEther(amount));
            const receipt = await tx.wait();
            console.log("입찰이 제출되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("입찰 제출 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 입찰 목록 조회
     * @param {number} proposalId - 제안 ID
     * @returns {Promise<Array>} 입찰 목록
     */
    async getBids(proposalId) {
        try {
            const bids = await this.contract.getBids(proposalId);
            return bids.map(bid => ({
                insurer: bid.insurer,
                amount: ethers.formatEther(bid.amount),
                createdAt: new Date(bid.createdAt * 1000).toISOString(),
                isActive: bid.isActive
            }));
        } catch (error) {
            console.error("입찰 목록 조회 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 계약 생성
     * @param {number} proposalId - 제안 ID
     * @param {number} bidIndex - 입찰 인덱스
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async createContract(proposalId, bidIndex) {
        try {
            const tx = await this.contract.createContract(proposalId, bidIndex);
            const receipt = await tx.wait();
            console.log("계약이 생성되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("계약 생성 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 계약 조회
     * @param {number} contractId - 계약 ID
     * @returns {Promise<Object>} 계약 정보
     */
    async getContract(contractId) {
        try {
            const contract = await this.contract.getContract(contractId);
            return {
                proposalId: contract.proposalId.toString(),
                insurer: contract.insurer,
                premium: ethers.formatEther(contract.premium),
                coverage: ethers.formatEther(contract.coverage),
                startTime: new Date(contract.startTime * 1000).toISOString(),
                endTime: new Date(contract.endTime * 1000).toISOString(),
                isActive: contract.isActive
            };
        } catch (error) {
            console.error("계약 조회 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 보험금 청구 제출
     * @param {number} contractId - 계약 ID
     * @param {string} description - 청구 설명
     * @param {string} amount - 청구 금액
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async submitClaim(contractId, description, amount) {
        try {
            const tx = await this.contract.submitClaim(
                contractId,
                description,
                ethers.parseEther(amount)
            );
            const receipt = await tx.wait();
            console.log("보험금 청구가 제출되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("보험금 청구 제출 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 청구 처리
     * @param {number} contractId - 계약 ID
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async processClaim(contractId) {
        try {
            const tx = await this.contract.processClaim(contractId);
            const receipt = await tx.wait();
            console.log("청구가 처리되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("청구 처리 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 리뷰 제출
     * @param {number} contractId - 계약 ID
     * @param {string} content - 리뷰 내용
     * @param {number} rating - 평점 (1-10)
     * @returns {Promise<Object>} 트랜잭션 결과
     */
    async submitReview(contractId, content, rating) {
        try {
            const tx = await this.contract.submitReview(contractId, content, rating);
            const receipt = await tx.wait();
            console.log("리뷰가 제출되었습니다:", receipt);
            return receipt;
        } catch (error) {
            console.error("리뷰 제출 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 리뷰 조회
     * @param {number} contractId - 계약 ID
     * @returns {Promise<Object>} 리뷰 정보
     */
    async getReview(contractId) {
        try {
            const review = await this.contract.getReview(contractId);
            return {
                contractId: review.contractId.toString(),
                reviewer: review.reviewer,
                content: review.content,
                rating: review.rating.toString(),
                timestamp: new Date(review.timestamp * 1000).toISOString()
            };
        } catch (error) {
            console.error("리뷰 조회 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 토큰 잔액 조회
     * @param {string} address - 조회할 주소
     * @returns {Promise<string>} 토큰 잔액
     */
    async getTokenBalance(address) {
        try {
            const balance = await this.tokenContract.balanceOf(address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error("토큰 잔액 조회 중 오류 발생:", error);
            throw error;
        }
    }

    /**
     * @description 사용자 리뷰 점수 조회
     * @param {string} address - 조회할 주소
     * @returns {Promise<number>} 리뷰 점수
     */
    async getUserReviewScore(address) {
        try {
            const score = await this.tokenContract.getUserReviewScore(address);
            return score.toString();
        } catch (error) {
            console.error("리뷰 점수 조회 중 오류 발생:", error);
            throw error;
        }
    }
}

module.exports = ContractManager;
