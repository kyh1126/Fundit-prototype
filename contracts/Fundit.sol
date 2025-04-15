// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./FunditToken.sol";

/**
 * @title Fundit
 * @dev 보험 상품 제안 및 계약 플랫폼
 * - 사용자가 보험 상품을 제안하고 보험사가 입찰하여 계약을 체결
 * - Oracle 시스템을 통한 보험금 청구 검증
 * - 리뷰 및 토큰 보상 시스템
 */
contract Fundit is Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // 카운터
    Counters.Counter private _proposalIds;    // 제안 ID 카운터
    Counters.Counter private _bidIds;         // 입찰 ID 카운터
    Counters.Counter private _contractIds;    // 계약 ID 카운터
    
    // 구조체 정의
    struct Proposal {
        uint256 id;           // 제안 ID
        address proposer;     // 제안자 주소
        string title;         // 제안 제목
        string description;   // 제안 설명
        uint256 premium;      // 보험료
        uint256 coverage;     // 보장 금액
        uint256 deadline;     // 마감 기한
        bool active;          // 활성화 여부
        bool finalized;       // 완료 여부
    }
    
    struct Bid {
        uint256 id;              // 입찰 ID
        uint256 proposalId;      // 제안 ID
        address insuranceCompany; // 보험사 주소
        uint256 premium;         // 제안 보험료
        uint256 coverage;        // 제안 보장 금액
        string terms;            // 보장 조건
        bool active;             // 활성화 여부
    }
    
    struct Contract {
        uint256 id;              // 계약 ID
        uint256 proposalId;      // 제안 ID
        uint256 bidId;           // 입찰 ID
        address proposer;        // 제안자 주소
        address insuranceCompany; // 보험사 주소
        uint256 premium;         // 보험료
        uint256 coverage;        // 보장 금액
        string terms;            // 보장 조건
        uint256 startDate;       // 시작일
        uint256 endDate;         // 종료일
        bool active;             // 활성화 여부
        bool claimed;            // 청구 여부
        bool exists;             // 존재 여부
    }
    
    // 매핑
    mapping(uint256 => Proposal) public proposals;                // 제안 정보
    mapping(uint256 => Bid) public bids;                         // 입찰 정보
    mapping(uint256 => Contract) public contracts;               // 계약 정보
    mapping(uint256 => Bid[]) public proposalBids;               // 제안별 입찰 목록
    mapping(address => bool) public insuranceCompanies;          // 등록된 보험사
    mapping(address => uint256[]) public userProposals;          // 사용자별 제안 목록
    mapping(address => uint256[]) public companyBids;            // 보험사별 입찰 목록
    mapping(address => uint256[]) public userContracts;          // 사용자별 계약 목록
    mapping(address => uint256[]) public companyContracts;       // 보험사별 계약 목록
    
    // Oracle 관련 변수
    mapping(uint256 => address) public contractOracles;          // 계약별 Oracle
    mapping(address => bool) public registeredOracles;           // 등록된 Oracle
    mapping(uint256 => bool) public claimsProcessed;            // 처리된 청구
    mapping(uint256 => uint256) public claimAmounts;            // 청구 금액
    mapping(uint256 => bool) public claimsApproved;             // 승인된 청구
    mapping(uint256 => uint256) public claimTimestamps;         // 청구 시간
    mapping(uint256 => uint256) public claimVerificationCounts; // 검증 횟수
    mapping(uint256 => mapping(address => bool)) public oracleVerifications; // Oracle 검증 결과
    mapping(uint256 => string) public claimDescriptions;        // 청구 설명
    mapping(uint256 => string[]) public claimEvidences;         // 청구 증거
    mapping(uint256 => mapping(address => string)) public oracleEvidences;   // Oracle 증거
    mapping(uint256 => uint256) public claimRejectionCounts;    // 거부 횟수
    mapping(uint256 => bool) public claimAutoRejected;          // 자동 거부 여부
    
    // 리뷰 관련 변수
    struct Review {
        uint256 contractId;     // 계약 ID
        address reviewer;       // 리뷰어 주소
        string content;         // 리뷰 내용
        uint256 rating;         // 평점
        uint256 timestamp;      // 작성 시간
        bool exists;            // 존재 여부
    }
    
    mapping(uint256 => Review) public reviews;                   // 리뷰 정보
    mapping(uint256 => bool) public hasReview;                   // 리뷰 존재 여부
    
    // 토큰 컨트랙트
    FunditToken public funditToken;
    
    // 이벤트
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, uint256 premium, uint256 coverage);
    event BidPlaced(uint256 indexed bidId, uint256 indexed proposalId, address indexed insuranceCompany, uint256 premium, uint256 coverage);
    event ContractCreated(uint256 indexed contractId, uint256 indexed proposalId, uint256 indexed bidId, address proposer, address insuranceCompany);
    event InsuranceClaimed(uint256 indexed contractId, uint256 amount);
    event InsurancePaid(uint256 indexed contractId, uint256 amount);
    event ClaimSubmitted(uint256 indexed contractId, string description, uint256 amount);
    event ClaimProcessed(uint256 indexed contractId, bool approved, uint256 amount);
    event PaymentProcessed(uint256 indexed contractId, address indexed recipient, uint256 amount);
    event ReviewSubmitted(uint256 indexed contractId, address indexed reviewer, string content, uint256 rating);
    event ReviewRewarded(uint256 indexed contractId, address indexed reviewer, uint256 amount);
    
    // 상수
    uint256 public constant MIN_PROPOSAL_DURATION = 1 days;     // 최소 제안 기간
    uint256 public constant MAX_PROPOSAL_DURATION = 30 days;    // 최대 제안 기간
    uint256 public constant MIN_BID_DURATION = 1 days;          // 최소 입찰 기간
    uint256 public constant MAX_BID_DURATION = 7 days;          // 최대 입찰 기간
    uint256 public constant MIN_CONTRACT_DURATION = 1 days;     // 최소 계약 기간
    uint256 public constant MAX_CONTRACT_DURATION = 365 days;   // 최대 계약 기간
    
    // Oracle 검증 관련 상수
    uint256 public constant MIN_VERIFICATION_COUNT = 3;         // 최소 검증 횟수
    uint256 public constant VERIFICATION_TIMEOUT = 1 days;      // 검증 타임아웃
    uint256 public constant MAX_CLAIM_AMOUNT = 1000 ether;      // 최대 청구 금액
    uint256 public constant MAX_REJECTION_COUNT = 2;            // 최대 거부 횟수
    uint256 public constant EVIDENCE_REQUIRED_LENGTH = 100;     // 증거 최소 길이
    
    // 생성자
    constructor() Ownable() {}
    
    // 제안 관련 함수
    /**
     * @dev 보험 상품 제안
     * @param title 제안 제목
     * @param description 제안 설명
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param duration 제안 기간 (초)
     */
    function proposeInsurance(
        string memory title,
        string memory description,
        uint256 premium,
        uint256 coverage,
        uint256 duration
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(bytes(title).length > 0, unicode"제목이 비어있습니다");
        require(bytes(description).length > 0, unicode"설명이 비어있습니다");
        require(premium > 0, unicode"보험료는 0보다 커야 합니다");
        require(coverage > 0, unicode"보장 금액은 0보다 커야 합니다");
        require(coverage >= premium, unicode"보장 금액은 보험료보다 크거나 같아야 합니다");
        require(duration >= MIN_PROPOSAL_DURATION && duration <= MAX_PROPOSAL_DURATION, unicode"잘못된 기간입니다");
        
        _proposalIds.increment();
        uint256 newProposalId = _proposalIds.current();
        
        proposals[newProposalId] = Proposal({
            id: newProposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            premium: premium,
            coverage: coverage,
            deadline: block.timestamp + duration,
            active: true,
            finalized: false
        });
        
        userProposals[msg.sender].push(newProposalId);
        
        emit ProposalCreated(newProposalId, msg.sender, title, premium, coverage);
        
        return newProposalId;
    }
    
    /**
     * @dev 제안 상세 정보 조회
     * @param proposalId 제안 ID
     */
    function getProposal(uint256 proposalId) public view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 premium,
        uint256 coverage,
        uint256 deadline,
        bool active,
        bool finalized
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.premium,
            proposal.coverage,
            proposal.deadline,
            proposal.active,
            proposal.finalized
        );
    }
    
    /**
     * @dev 제안 취소
     * @param proposalId 제안 ID
     */
    function cancelProposal(uint256 proposalId) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.proposer == msg.sender, "Not proposal owner");
        require(proposal.active, "Proposal is not active");
        require(!proposal.finalized, "Proposal is already finalized");
        
        proposal.active = false;
    }
    
    // 입찰 관련 함수
    /**
     * @dev 보험사 등록
     */
    function registerInsuranceCompany() public whenNotPaused nonReentrant {
        require(!insuranceCompanies[msg.sender], "Already registered");
        insuranceCompanies[msg.sender] = true;
    }
    
    /**
     * @dev 입찰 제출
     * @param proposalId 제안 ID
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param terms 보장 조건
     */
    function placeBid(
        uint256 proposalId,
        uint256 premium,
        uint256 coverage,
        string memory terms
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(insuranceCompanies[msg.sender], "Not registered insurance company");
        require(proposals[proposalId].id > 0, "Proposal does not exist");
        require(proposals[proposalId].active, "Proposal is not active");
        require(proposals[proposalId].deadline > block.timestamp, "Proposal deadline has passed");
        require(premium > 0, "Premium must be greater than 0");
        require(coverage > 0, "Coverage must be greater than 0");
        require(coverage >= premium, "Coverage must be greater than or equal to premium");
        require(bytes(terms).length > 0, "Terms cannot be empty");
        
        _bidIds.increment();
        uint256 newBidId = _bidIds.current();
        
        bids[newBidId] = Bid({
            id: newBidId,
            proposalId: proposalId,
            insuranceCompany: msg.sender,
            premium: premium,
            coverage: coverage,
            terms: terms,
            active: true
        });
        
        proposalBids[proposalId].push(bids[newBidId]);
        companyBids[msg.sender].push(newBidId);
        
        emit BidPlaced(newBidId, proposalId, msg.sender, premium, coverage);
        
        return newBidId;
    }
    
    /**
     * @dev 입찰 상세 정보 조회
     * @param bidId 입찰 ID
     */
    function getBid(uint256 bidId) public view returns (
        uint256 id,
        uint256 proposalId,
        address insuranceCompany,
        uint256 premium,
        uint256 coverage,
        string memory terms,
        bool active
    ) {
        Bid memory bid = bids[bidId];
        return (
            bid.id,
            bid.proposalId,
            bid.insuranceCompany,
            bid.premium,
            bid.coverage,
            bid.terms,
            bid.active
        );
    }
    
    /**
     * @dev 제안에 대한 모든 입찰 조회
     * @param proposalId 제안 ID
     */
    function getProposalBids(uint256 proposalId) public view returns (Bid[] memory) {
        return proposalBids[proposalId];
    }
    
    // 계약 관련 함수
    /**
     * @dev 입찰 수락 및 계약 체결
     * @param proposalId 제안 ID
     * @param bidId 입찰 ID
     * @param duration 계약 기간 (일)
     */
    function acceptBid(
        uint256 proposalId,
        uint256 bidId,
        uint256 duration
    ) public whenNotPaused nonReentrant returns (uint256) {
        Proposal storage proposal = proposals[proposalId];
        Bid storage bid = bids[bidId];
        
        require(proposal.id > 0, "Proposal does not exist");
        require(proposal.proposer == msg.sender, "Not proposal owner");
        require(proposal.active, "Proposal is not active");
        require(!proposal.finalized, "Proposal is already finalized");
        require(bid.id > 0, "Bid does not exist");
        require(bid.proposalId == proposalId, "Bid does not match proposal");
        require(bid.active, "Bid is not active");
        require(duration >= MIN_CONTRACT_DURATION && duration <= MAX_CONTRACT_DURATION, "Invalid duration");
        
        // 제안 및 입찰 상태 업데이트
        proposal.active = false;
        proposal.finalized = true;
        bid.active = false;
        
        // 계약 생성
        _contractIds.increment();
        uint256 newContractId = _contractIds.current();
        
        contracts[newContractId] = Contract({
            id: newContractId,
            proposalId: proposalId,
            bidId: bidId,
            proposer: proposal.proposer,
            insuranceCompany: bid.insuranceCompany,
            premium: bid.premium,
            coverage: bid.coverage,
            terms: bid.terms,
            startDate: block.timestamp,
            endDate: block.timestamp + duration,
            active: true,
            claimed: false,
            exists: true
        });
        
        userContracts[proposal.proposer].push(newContractId);
        companyContracts[bid.insuranceCompany].push(newContractId);
        
        emit ContractCreated(newContractId, proposalId, bidId, proposal.proposer, bid.insuranceCompany);
        
        return newContractId;
    }
    
    /**
     * @dev 계약 상세 정보 조회
     * @param contractId 계약 ID
     */
    function getContract(uint256 contractId) public view returns (
        uint256 id,
        uint256 proposalId,
        uint256 bidId,
        address proposer,
        address insuranceCompany,
        uint256 premium,
        uint256 coverage,
        string memory terms,
        uint256 startDate,
        uint256 endDate,
        bool active,
        bool claimed
    ) {
        Contract memory contract_ = contracts[contractId];
        return (
            contract_.id,
            contract_.proposalId,
            contract_.bidId,
            contract_.proposer,
            contract_.insuranceCompany,
            contract_.premium,
            contract_.coverage,
            contract_.terms,
            contract_.startDate,
            contract_.endDate,
            contract_.active,
            contract_.claimed
        );
    }
    
    // 보험금 청구 및 지급 관련 함수
    /**
     * @dev 보험금 청구
     * @param contractId 계약 ID
     * @param description 청구 설명
     * @param amount 청구 금액
     * @param evidence 초기 증거
     */
    function submitClaim(
        uint256 contractId, 
        string memory description, 
        uint256 amount,
        string memory evidence
    ) external nonReentrant whenNotPaused {
        require(contracts[contractId].exists, unicode"계약이 존재하지 않습니다");
        require(contracts[contractId].proposer == msg.sender, unicode"계약 소유자가 아닙니다");
        require(!claimsProcessed[contractId], unicode"이미 처리된 청구입니다");
        require(amount <= contracts[contractId].coverage, unicode"청구 금액이 보장 금액을 초과합니다");
        require(amount <= MAX_CLAIM_AMOUNT, unicode"청구 금액이 최대 한도를 초과합니다");
        require(bytes(description).length >= EVIDENCE_REQUIRED_LENGTH, unicode"청구 설명이 너무 짧습니다");
        require(bytes(evidence).length >= EVIDENCE_REQUIRED_LENGTH, unicode"증거가 너무 짧습니다");
        
        // 청구 정보 저장
        claimAmounts[contractId] = amount;
        claimDescriptions[contractId] = description;
        claimTimestamps[contractId] = block.timestamp;
        claimVerificationCounts[contractId] = 0;
        claimRejectionCounts[contractId] = 0;
        claimAutoRejected[contractId] = false;
        
        // 초기 증거 저장
        claimEvidences[contractId].push(evidence);
        
        emit ClaimSubmitted(contractId, description, amount);
    }
    
    /**
     * @dev Oracle 등록 (소유자만 가능)
     * @param oracleAddress Oracle 주소
     */
    function registerOracle(address oracleAddress) external onlyOwner {
        registeredOracles[oracleAddress] = true;
    }
    
    /**
     * @dev Oracle 등록 해제 (소유자만 가능)
     * @param oracleAddress Oracle 주소
     */
    function unregisterOracle(address oracleAddress) external onlyOwner {
        registeredOracles[oracleAddress] = false;
    }
    
    /**
     * @dev Oracle 검증 결과 제출
     * @param contractId 계약 ID
     * @param approved 승인 여부
     * @param evidence 증거
     */
    function submitOracleVerification(
        uint256 contractId,
        bool approved,
        string memory evidence
    ) external nonReentrant whenNotPaused {
        require(registeredOracles[msg.sender], unicode"인증된 Oracle만 검증할 수 있습니다");
        require(contractOracles[contractId] == msg.sender, unicode"계약에 할당된 Oracle만 검증할 수 있습니다");
        require(!claimsProcessed[contractId], unicode"이미 처리된 청구입니다");
        require(!oracleVerifications[contractId][msg.sender], unicode"이미 검증한 Oracle입니다");
        require(block.timestamp <= claimTimestamps[contractId] + VERIFICATION_TIMEOUT, unicode"검증 기간이 만료되었습니다");
        require(bytes(evidence).length >= EVIDENCE_REQUIRED_LENGTH, unicode"증거가 너무 짧습니다");
        
        // Oracle 검증 기록
        oracleVerifications[contractId][msg.sender] = true;
        oracleEvidences[contractId][msg.sender] = evidence;
        claimVerificationCounts[contractId]++;
        
        // 거부 횟수 업데이트
        if (!approved) {
            claimRejectionCounts[contractId]++;
            
            // 최대 거부 횟수 초과 시 자동 거부
            if (claimRejectionCounts[contractId] >= MAX_REJECTION_COUNT) {
                claimAutoRejected[contractId] = true;
                _processClaim(contractId, false);
                return;
            }
        }
        
        // 최소 검증 수를 충족한 경우 청구 처리
        if (claimVerificationCounts[contractId] >= MIN_VERIFICATION_COUNT) {
            _processClaim(contractId, approved);
        }
    }
    
    /**
     * @dev 내부 청구 처리 함수
     * @param contractId 계약 ID
     * @param approved 승인 여부
     */
    function _processClaim(uint256 contractId, bool approved) internal {
        require(claimVerificationCounts[contractId] >= MIN_VERIFICATION_COUNT, unicode"충분한 검증이 이루어지지 않았습니다");
        require(!claimsProcessed[contractId], unicode"이미 처리된 청구입니다");
        
        claimsApproved[contractId] = approved;
        claimsProcessed[contractId] = true;
        
        emit ClaimProcessed(contractId, approved, claimAmounts[contractId]);
        
        if (approved) {
            _processPayment(contractId);
        }
    }
    
    /**
     * @dev 계약 오라클 설정 (소유자만 가능)
     * @param contractId 계약 ID
     * @param oracleAddress 체인링크 오라클 주소
     */
    function setContractOracle(uint256 contractId, address oracleAddress) external onlyOwner {
        require(contracts[contractId].exists, "Contract does not exist");
        contractOracles[contractId] = oracleAddress;
    }
    
    /**
     * @dev 내부 지급 처리 함수
     * @param contractId 계약 ID
     */
    function _processPayment(uint256 contractId) internal {
        require(contracts[contractId].exists, "Contract does not exist");
        require(claimsProcessed[contractId], "Claim not processed");
        require(claimsApproved[contractId], "Claim not approved");
        
        uint256 amount = claimAmounts[contractId];
        address recipient = contracts[contractId].proposer;
        
        // Transfer payment (in a real implementation, this would use a token or ETH)
        // For this example, we'll just emit an event
        emit PaymentProcessed(contractId, recipient, amount);
    }
    
    // 관리자 함수
    /**
     * @dev 컨트랙트 일시 정지
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev 컨트랙트 정지 해제
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 보험사 등록 상태 변경
     * @param company 보험사 주소
     * @param status 등록 상태
     */
    function setInsuranceCompanyStatus(address company, bool status) public onlyOwner {
        insuranceCompanies[company] = status;
    }
    
    /**
     * @dev FunditToken 컨트랙트 주소 설정
     * @param tokenAddress FunditToken 컨트랙트 주소
     */
    function setFunditToken(address tokenAddress) external onlyOwner {
        funditToken = FunditToken(tokenAddress);
    }
    
    /**
     * @dev 보험 계약에 대한 리뷰 제출
     * @param contractId 계약 ID
     * @param content 리뷰 내용
     * @param rating 평점 (1-5)
     */
    function submitReview(uint256 contractId, string memory content, uint256 rating) external nonReentrant whenNotPaused {
        require(contracts[contractId].exists, unicode"계약이 존재하지 않습니다");
        require(msg.sender == contracts[contractId].proposer, unicode"계약 소유자만 리뷰를 작성할 수 있습니다");
        require(!hasReview[contractId], unicode"이미 리뷰가 작성되었습니다");
        require(rating >= 1 && rating <= 5, unicode"평점은 1에서 5 사이여야 합니다");
        
        // Create review
        reviews[contractId] = Review({
            contractId: contractId,
            reviewer: msg.sender,
            content: content,
            rating: rating,
            timestamp: block.timestamp,
            exists: true
        });
        
        hasReview[contractId] = true;
        
        emit ReviewSubmitted(contractId, msg.sender, content, rating);
        
        // Calculate quality score based on content length and rating
        uint256 contentLength = bytes(content).length;
        uint256 qualityScore = 1;
        
        // Adjust quality score based on content length
        if (contentLength >= 500) {
            qualityScore = 10;
        } else if (contentLength >= 300) {
            qualityScore = 8;
        } else if (contentLength >= 200) {
            qualityScore = 6;
        } else if (contentLength >= 100) {
            qualityScore = 4;
        } else if (contentLength >= 50) {
            qualityScore = 2;
        }
        
        // Adjust quality score based on rating
        qualityScore = (qualityScore * rating) / 5;
        
        // Reward the user with tokens
        funditToken.rewardReview(msg.sender, content, rating);
    }
    
    /**
     * @dev 보험 계약의 리뷰 조회
     * @param contractId 계약 ID
     * @return 리뷰
     */
    function getReview(uint256 contractId) external view returns (Review memory) {
        require(hasReview[contractId], "Review does not exist");
        return reviews[contractId];
    }
    
    /**
     * @dev 청구 증거 추가
     * @param contractId 계약 ID
     * @param evidence 추가 증거
     */
    function addClaimEvidence(uint256 contractId, string memory evidence) external nonReentrant whenNotPaused {
        require(contracts[contractId].exists, unicode"계약이 존재하지 않습니다");
        require(contracts[contractId].proposer == msg.sender, unicode"계약 소유자가 아닙니다");
        require(!claimsProcessed[contractId], unicode"이미 처리된 청구입니다");
        require(bytes(evidence).length >= EVIDENCE_REQUIRED_LENGTH, unicode"증거가 너무 짧습니다");
        
        claimEvidences[contractId].push(evidence);
    }
    
    /**
     * @dev 청구 정보 조회
     * @param contractId 계약 ID
     */
    function getClaimInfo(uint256 contractId) public view returns (bool processed, bool approved) {
        return (claimsProcessed[contractId], claimsApproved[contractId]);
    }
}
