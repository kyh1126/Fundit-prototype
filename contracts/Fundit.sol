// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./FunditToken.sol";

/**
 * @title Fundit
 * @dev 사용자가 보험 상품을 제안하고 보험사가 입찰하여 계약을 체결하는 플랫폼
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
        uint256 createdAt;    // 생성 시간
        uint256 updatedAt;    // 수정 시간
    }
    
    struct Bid {
        uint256 id;              // 입찰 ID
        uint256 proposalId;      // 제안 ID
        address insuranceCompany; // 보험사 주소
        uint256 premium;         // 제안 보험료
        uint256 coverage;        // 제안 보장 금액
        string terms;            // 보장 조건
        bool active;             // 활성화 여부
        uint256 createdAt;       // 생성 시간
        uint256 updatedAt;       // 수정 시간
        uint256 deadline;        // 입찰 마감 시간
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
        ContractStatus status;   // 계약 상태
        bool claimed;            // 청구 여부
        bool exists;             // 계약 존재 여부
        uint256 createdAt;       // 생성 시간
        uint256 updatedAt;       // 수정 시간
    }
    
    // Oracle 관련 구조체
    struct Oracle {
        address oracleAddress;   // Oracle 주소
        bool isActive;           // 활성 상태
        uint256 trustScore;      // 신뢰도 점수 (1-100)
        uint256 verificationCount; // 검증 횟수
        uint256 successCount;    // 성공 횟수
        uint256 rewardBalance;   // 보상 잔액
        uint256 registeredAt;    // 등록 시간
    }
    
    // 리뷰 관련 구조체
    struct Review {
        uint256 contractId;     // 계약 ID
        address reviewer;       // 리뷰어 주소
        string content;         // 리뷰 내용
        uint256 rating;         // 평점
        uint256 timestamp;      // 작성 시간
        bool exists;            // 존재 여부
        bool isDeleted;         // 삭제 여부
        uint256 reportCount;    // 신고 횟수
        uint256 qualityScore;   // 품질 점수
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
    mapping(uint256 => address[]) public contractOracles;        // 계약별 Oracle 목록
    mapping(address => Oracle) public oracles;                   // Oracle 정보
    mapping(uint256 => bool) public claimsProcessed;            // 처리된 청구
    mapping(uint256 => bool) public claimsApproved;             // 승인된 청구
    mapping(uint256 => uint256) public claimAmounts;            // 청구 금액
    mapping(uint256 => uint256) public claimTimestamps;         // 청구 시간
    mapping(uint256 => uint256) public claimVerificationCounts; // 검증 횟수
    mapping(uint256 => mapping(address => bool)) public oracleVerifications; // Oracle 검증 결과
    mapping(uint256 => string) public claimDescriptions;        // 청구 설명
    mapping(uint256 => string[]) public claimEvidences;         // 청구 증거
    mapping(uint256 => mapping(address => string)) public oracleEvidences;   // Oracle 증거
    mapping(uint256 => uint256) public claimRejectionCounts;    // 거부 횟수
    mapping(uint256 => bool) public claimAutoRejected;          // 자동 거부 여부
    
    // 리뷰 관련 변수
    mapping(uint256 => Review) public reviews;                   // 리뷰 정보
    mapping(uint256 => bool) public hasReview;                   // 리뷰 존재 여부
    mapping(uint256 => mapping(address => bool)) public reviewReports; // 리뷰 신고
    
    // 토큰 컨트랙트
    FunditToken public funditToken;
    
    // 이벤트
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event ProposalUpdated(uint256 indexed proposalId, address indexed proposer);
    event ProposalCancelled(uint256 indexed proposalId, address indexed proposer);
    event BidSubmitted(uint256 indexed proposalId, address indexed bidder, uint256 premium);
    event BidUpdated(uint256 indexed bidId, address indexed bidder, uint256 premium);
    event BidCancelled(uint256 indexed bidId, address indexed bidder);
    event ContractCreated(uint256 indexed contractId, uint256 indexed proposalId);
    event ContractUpdated(uint256 indexed contractId);
    event ContractCancelled(uint256 indexed contractId);
    event ClaimSubmitted(uint256 indexed contractId, address indexed claimer, uint256 amount);
    event OracleRegistered(address indexed oracle);
    event OracleUnregistered(address indexed oracle);
    event OracleStatusChanged(address indexed oracle, bool status);
    event OracleRewarded(address indexed oracle, uint256 amount);
    event InsuranceCompanyStatusChanged(address indexed company, bool status);
    event OracleVerificationSubmitted(uint256 indexed contractId, address indexed oracle, bool isValid);
    event ReviewSubmitted(uint256 indexed contractId, address indexed reviewer, string content, uint256 rating);
    event ReviewUpdated(uint256 indexed contractId, address indexed reviewer);
    event ReviewDeleted(uint256 indexed contractId, address indexed reviewer);
    event ReviewReported(uint256 indexed contractId, address indexed reporter);
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
    uint256 public constant ORACLE_REWARD_AMOUNT = 10 ether;    // Oracle 보상 금액
    uint256 public constant MAX_ORACLES_PER_CONTRACT = 5;       // 계약당 최대 Oracle 수
    
    enum ContractStatus {
        None,       // 초기 상태
        Active,     // 활성화
        UnderReview,// 검토 중
        Completed,  // 완료됨
        Cancelled   // 취소됨
    }
    
    // 생성자
    constructor() Ownable() {}
    
    // 제안 관련 함수
    /**
     * @dev 보험 상품 제안
     * @param title 제안 제목
     * @param description 제안 설명
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param duration 제안 기간 (일)
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
            finalized: false,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        userProposals[msg.sender].push(newProposalId);
        
        emit ProposalCreated(newProposalId, msg.sender);
        
        return newProposalId;
    }
    
    /**
     * @dev 제안 수정
     * @param proposalId 제안 ID
     * @param title 새로운 제목
     * @param description 새로운 설명
     * @param premium 새로운 보험료
     * @param coverage 새로운 보장 금액
     */
    function updateProposal(
        uint256 proposalId,
        string memory title,
        string memory description,
        uint256 premium,
        uint256 coverage
    ) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id > 0, unicode"존재하지 않는 제안입니다");
        require(proposal.proposer == msg.sender, unicode"제안의 소유자가 아닙니다");
        require(proposal.active, unicode"제안이 활성화 상태가 아닙니다");
        require(!proposal.finalized, unicode"이미 완료된 제안입니다");
        require(proposal.deadline > block.timestamp, unicode"제안 기간이 만료되었습니다");
        require(bytes(title).length > 0, unicode"제목이 비어있습니다");
        require(bytes(description).length > 0, unicode"설명이 비어있습니다");
        require(premium > 0, unicode"보험료는 0보다 커야 합니다");
        require(coverage > 0, unicode"보장 금액은 0보다 커야 합니다");
        require(coverage >= premium, unicode"보장 금액은 보험료보다 크거나 같아야 합니다");
        
        proposal.title = title;
        proposal.description = description;
        proposal.premium = premium;
        proposal.coverage = coverage;
        proposal.updatedAt = block.timestamp;
        
        emit ProposalUpdated(proposalId, msg.sender);
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
        bool finalized,
        uint256 createdAt,
        uint256 updatedAt
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
            proposal.finalized,
            proposal.createdAt,
            proposal.updatedAt
        );
    }
    
    /**
     * @dev 제안 취소
     * @param proposalId 제안 ID
     */
    function cancelProposal(uint256 proposalId) public whenNotPaused nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id > 0, unicode"존재하지 않는 제안입니다");
        require(proposal.proposer == msg.sender, unicode"제안의 소유자가 아닙니다");
        require(proposal.active, unicode"제안이 활성화 상태가 아닙니다");
        require(!proposal.finalized, unicode"이미 완료된 제안입니다");
        require(proposal.deadline > block.timestamp, unicode"제안 기간이 만료되었습니다");
        
        proposal.active = false;
        proposal.updatedAt = block.timestamp;
        
        emit ProposalCancelled(proposalId, msg.sender);
    }
    
    // 입찰 관련 함수
    /**
     * @dev 보험사 등록
     */
    function registerInsuranceCompany() public whenNotPaused nonReentrant {
        require(!insuranceCompanies[msg.sender], unicode"이미 등록된 보험사입니다");
        insuranceCompanies[msg.sender] = true;
    }
    
    /**
     * @dev 입찰 제출
     * @param proposalId 제안 ID
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param terms 보장 조건
     * @param bidDuration 입찰 기간 (일)
     */
    function placeBid(
        uint256 proposalId,
        uint256 premium,
        uint256 coverage,
        string memory terms,
        uint256 bidDuration
    ) public whenNotPaused nonReentrant returns (uint256) {
        require(insuranceCompanies[msg.sender], unicode"등록되지 않은 보험사입니다");
        require(proposals[proposalId].id > 0, unicode"존재하지 않는 제안입니다");
        require(proposals[proposalId].active, unicode"제안이 활성화 상태가 아닙니다");
        require(proposals[proposalId].deadline > block.timestamp, unicode"제안 기간이 만료되었습니다");
        require(premium > 0, unicode"보험료는 0보다 커야 합니다");
        require(coverage > 0, unicode"보장 금액은 0보다 커야 합니다");
        require(coverage >= premium, unicode"보장 금액은 보험료보다 크거나 같아야 합니다");
        require(bytes(terms).length > 0, unicode"보장 조건이 비어있습니다");
        require(bidDuration >= MIN_BID_DURATION && bidDuration <= MAX_BID_DURATION, unicode"잘못된 입찰 기간입니다");
        
        _bidIds.increment();
        uint256 newBidId = _bidIds.current();
        
        bids[newBidId] = Bid({
            id: newBidId,
            proposalId: proposalId,
            insuranceCompany: msg.sender,
            premium: premium,
            coverage: coverage,
            terms: terms,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            deadline: block.timestamp + bidDuration
        });
        
        proposalBids[proposalId].push(bids[newBidId]);
        companyBids[msg.sender].push(newBidId);
        
        emit BidSubmitted(proposalId, msg.sender, premium);
        
        return newBidId;
    }
    
    /**
     * @dev 입찰 수정
     * @param bidId 입찰 ID
     * @param premium 새로운 보험료
     * @param coverage 새로운 보장 금액
     * @param terms 새로운 보장 조건
     */
    function updateBid(
        uint256 bidId,
        uint256 premium,
        uint256 coverage,
        string memory terms
    ) public whenNotPaused nonReentrant {
        Bid storage bid = bids[bidId];
        require(bid.id > 0, unicode"존재하지 않는 입찰입니다");
        require(bid.insuranceCompany == msg.sender, unicode"입찰의 소유자가 아닙니다");
        require(bid.active, unicode"입찰이 활성화 상태가 아닙니다");
        require(bid.deadline > block.timestamp, unicode"입찰 기간이 만료되었습니다");
        require(premium > 0, unicode"보험료는 0보다 커야 합니다");
        require(coverage > 0, unicode"보장 금액은 0보다 커야 합니다");
        require(bytes(terms).length > 0, unicode"보장 조건이 비어있습니다");
        
        bid.premium = premium;
        bid.coverage = coverage;
        bid.terms = terms;
        bid.updatedAt = block.timestamp;
        
        emit BidUpdated(bidId, msg.sender, premium);
    }
    
    /**
     * @dev 입찰 취소
     * @param bidId 입찰 ID
     */
    function cancelBid(uint256 bidId) public whenNotPaused nonReentrant {
        Bid storage bid = bids[bidId];
        require(bid.id > 0, unicode"존재하지 않는 입찰입니다");
        require(bid.insuranceCompany == msg.sender, unicode"입찰의 소유자가 아닙니다");
        require(bid.active, unicode"입찰이 활성화 상태가 아닙니다");
        require(bid.deadline > block.timestamp, unicode"입찰 기간이 만료되었습니다");
        
        bid.active = false;
        bid.updatedAt = block.timestamp;
        
        emit BidCancelled(bidId, msg.sender);
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
        bool active,
        uint256 createdAt,
        uint256 updatedAt,
        uint256 deadline
    ) {
        Bid memory bid = bids[bidId];
        return (
            bid.id,
            bid.proposalId,
            bid.insuranceCompany,
            bid.premium,
            bid.coverage,
            bid.terms,
            bid.active,
            bid.createdAt,
            bid.updatedAt,
            bid.deadline
        );
    }
    
    /**
     * @dev 제안에 대한 모든 입찰 조회
     * @param proposalId 제안 ID
     */
    function getProposalBids(uint256 proposalId) public view returns (Bid[] memory) {
        return proposalBids[proposalId];
    }
    
    /**
     * @dev 보험사별 입찰 목록 조회
     * @param company 보험사 주소
     */
    function getCompanyBids(address company) public view returns (uint256[] memory) {
        return companyBids[company];
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
        
        require(proposal.id > 0, unicode"존재하지 않는 제안입니다");
        require(proposal.proposer == msg.sender, unicode"제안의 소유자가 아닙니다");
        require(proposal.active, unicode"제안이 활성화 상태가 아닙니다");
        require(!proposal.finalized, unicode"이미 완료된 제안입니다");
        require(bid.id > 0, unicode"존재하지 않는 입찰입니다");
        require(bid.proposalId == proposalId, unicode"입찰이 해당 제안에 속하지 않습니다");
        require(bid.active, unicode"입찰이 활성화 상태가 아닙니다");
        require(bid.deadline > block.timestamp, unicode"입찰 기간이 만료되었습니다");
        require(duration >= MIN_CONTRACT_DURATION && duration <= MAX_CONTRACT_DURATION, unicode"잘못된 계약 기간입니다");
        
        // 제안 및 입찰 상태 업데이트
        proposal.active = false;
        proposal.finalized = true;
        proposal.updatedAt = block.timestamp;
        bid.active = false;
        bid.updatedAt = block.timestamp;
        
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
            status: ContractStatus.Active,
            claimed: false,
            exists: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        userContracts[proposal.proposer].push(newContractId);
        companyContracts[bid.insuranceCompany].push(newContractId);
        
        emit ContractCreated(newContractId, proposalId);
        
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
        ContractStatus status,
        bool claimed,
        uint256 createdAt,
        uint256 updatedAt
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
            contract_.status,
            contract_.claimed,
            contract_.createdAt,
            contract_.updatedAt
        );
    }
    
    /**
     * @dev 계약 수정
     * @param contractId 계약 ID
     * @param terms 새로운 보장 조건
     */
    function updateContract(uint256 contractId, string memory terms) public whenNotPaused nonReentrant {
        Contract storage contract_ = contracts[contractId];
        require(contract_.exists, unicode"존재하지 않는 계약입니다");
        require(contract_.status == ContractStatus.Active, unicode"활성화된 계약만 수정할 수 있습니다");
        require(
            contract_.proposer == msg.sender || contract_.insuranceCompany == msg.sender,
            unicode"계약 당사자만 수정할 수 있습니다"
        );
        require(bytes(terms).length > 0, unicode"보장 조건이 비어있습니다");
        
        contract_.terms = terms;
        contract_.updatedAt = block.timestamp;
        
        emit ContractUpdated(contractId);
    }
    
    /**
     * @dev 계약 취소
     * @param contractId 계약 ID
     */
    function cancelContract(uint256 contractId) public whenNotPaused nonReentrant {
        Contract storage contract_ = contracts[contractId];
        require(contract_.exists, unicode"존재하지 않는 계약입니다");
        require(contract_.status == ContractStatus.Active, unicode"활성화된 계약만 취소할 수 있습니다");
        require(
            contract_.proposer == msg.sender || contract_.insuranceCompany == msg.sender,
            unicode"계약 당사자만 취소할 수 있습니다"
        );
        require(!contract_.claimed, unicode"이미 처리된 청구입니다");
        
        contract_.status = ContractStatus.Cancelled;
        contract_.updatedAt = block.timestamp;
        
        emit ContractCancelled(contractId);
    }
    
    // Oracle 관련 함수
    /**
     * @dev Oracle 등록
     * @param oracle Oracle 주소
     */
    function registerOracle(address oracle) external onlyOwner {
        require(oracle != address(0), unicode"잘못된 Oracle 주소입니다");
        require(!oracles[oracle].isActive, unicode"이미 등록된 Oracle입니다");
        
        oracles[oracle] = Oracle({
            oracleAddress: oracle,
            isActive: true,
            trustScore: 50, // 기본 신뢰도 점수
            verificationCount: 0,
            successCount: 0,
            rewardBalance: 0,
            registeredAt: block.timestamp
        });
        
        emit OracleRegistered(oracle);
    }
    
    /**
     * @dev Oracle 등록 해제
     * @param oracle Oracle 주소
     */
    function unregisterOracle(address oracle) external onlyOwner {
        require(oracles[oracle].isActive, unicode"등록되지 않은 Oracle입니다");
        oracles[oracle].isActive = false;
        emit OracleUnregistered(oracle);
    }
    
    /**
     * @dev Oracle 신뢰도 점수 업데이트
     * @param oracle Oracle 주소
     * @param newTrustScore 새로운 신뢰도 점수
     */
    function updateOracleTrustScore(address oracle, uint256 newTrustScore) external onlyOwner {
        require(oracles[oracle].isActive, unicode"등록되지 않은 Oracle입니다");
        require(newTrustScore <= 100, unicode"신뢰도 점수는 0에서 100 사이여야 합니다");
        
        oracles[oracle].trustScore = newTrustScore;
    }
    
    /**
     * @dev 계약에 Oracle 할당
     * @param contractId 계약 ID
     * @param oracleAddresses Oracle 주소 배열
     */
    function assignOraclesToContract(uint256 contractId, address[] memory oracleAddresses) external onlyOwner {
        require(contracts[contractId].exists, unicode"존재하지 않는 계약입니다");
        require(oracleAddresses.length <= MAX_ORACLES_PER_CONTRACT, unicode"Oracle 수가 너무 많습니다");
        
        for (uint256 i = 0; i < oracleAddresses.length; i++) {
            require(oracles[oracleAddresses[i]].isActive, unicode"활성화되지 않은 Oracle입니다");
            contractOracles[contractId].push(oracleAddresses[i]);
        }
    }
    
    /**
     * @dev Oracle 보상 지급
     * @param oracle Oracle 주소
     */
    function rewardOracle(address oracle) external onlyOwner {
        require(oracles[oracle].isActive, unicode"활성화되지 않은 Oracle입니다");
        
        uint256 reward = ORACLE_REWARD_AMOUNT;
        oracles[oracle].rewardBalance += reward;
        oracles[oracle].successCount++;
        
        emit OracleRewarded(oracle, reward);
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
        
        emit ClaimSubmitted(contractId, msg.sender, amount);
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
        require(contractOracles[contractId].length > 0, unicode"계약에 할당된 Oracle이 없습니다");
        require(_isOracleAssigned(contractId, msg.sender), unicode"계약에 할당되지 않은 Oracle입니다");
        require(!claimsProcessed[contractId], unicode"이미 처리된 청구입니다");
        require(!oracleVerifications[contractId][msg.sender], unicode"이미 검증한 Oracle입니다");
        require(block.timestamp <= claimTimestamps[contractId] + VERIFICATION_TIMEOUT, unicode"검증 기간이 만료되었습니다");
        require(bytes(evidence).length >= EVIDENCE_REQUIRED_LENGTH, unicode"증거가 너무 짧습니다");
        
        // Oracle 검증 기록
        oracleVerifications[contractId][msg.sender] = true;
        oracleEvidences[contractId][msg.sender] = evidence;
        claimVerificationCounts[contractId]++;
        
        // Oracle 통계 업데이트
        oracles[msg.sender].verificationCount++;
        
        // 이벤트 발생
        emit OracleVerificationSubmitted(contractId, msg.sender, approved);
        
        // 거부 횟수 업데이트
        if (!approved) {
            claimRejectionCounts[contractId]++;
            
            // 최대 거부 횟수 초과 시 자동 거부
            if (claimRejectionCounts[contractId] >= MAX_REJECTION_COUNT) {
                claimAutoRejected[contractId] = true;
                _processClaim(contractId, false);
                return;
            }
        } else {
            oracles[msg.sender].successCount++;
        }
        
        // 최소 검증 수를 충족한 경우 청구 처리
        if (claimVerificationCounts[contractId] >= MIN_VERIFICATION_COUNT) {
            _processClaim(contractId, approved);
        }
    }
    
    /**
     * @dev Oracle이 계약에 할당되었는지 확인
     * @param contractId 계약 ID
     * @param oracle Oracle 주소
     */
    function _isOracleAssigned(uint256 contractId, address oracle) internal view returns (bool) {
        address[] memory assignedOracles = contractOracles[contractId];
        for (uint256 i = 0; i < assignedOracles.length; i++) {
            if (assignedOracles[i] == oracle) {
                return true;
            }
        }
        return false;
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
        
        emit ClaimSubmitted(contractId, msg.sender, claimAmounts[contractId]);
        
        if (approved) {
            _processPayment(contractId);
        }
    }
    
    /**
     * @dev 내부 지급 처리 함수
     * @param contractId 계약 ID
     */
    function _processPayment(uint256 contractId) internal {
        require(contracts[contractId].exists, unicode"계약이 존재하지 않습니다");
        require(claimsProcessed[contractId], unicode"청구가 처리되지 않았습니다");
        require(claimsApproved[contractId], unicode"청구가 승인되지 않았습니다");
        
        uint256 amount = claimAmounts[contractId];
        address recipient = contracts[contractId].proposer;
        
        // 지급 처리 (실제 구현에서는 토큰이나 ETH를 사용)
        // 이 예제에서는 이벤트만 발생시킴
        emit ClaimSubmitted(contractId, recipient, amount);
    }
    
    // 리뷰 관련 함수
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
        
        // 품질 점수 계산
        uint256 contentLength = bytes(content).length;
        uint256 qualityScore = _calculateQualityScore(contentLength, rating);
        
        // Create review
        reviews[contractId] = Review({
            contractId: contractId,
            reviewer: msg.sender,
            content: content,
            rating: rating,
            timestamp: block.timestamp,
            exists: true,
            isDeleted: false,
            reportCount: 0,
            qualityScore: qualityScore
        });
        
        hasReview[contractId] = true;
        
        emit ReviewSubmitted(contractId, msg.sender, content, rating);
        
        // Reward the user with tokens
        if (address(funditToken) != address(0)) {
            funditToken.rewardReview(msg.sender, content, rating);
            emit ReviewRewarded(contractId, msg.sender, qualityScore);
        }
    }
    
    /**
     * @dev 리뷰 수정
     * @param contractId 계약 ID
     * @param newContent 새로운 내용
     * @param newRating 새로운 평점
     */
    function updateReview(uint256 contractId, string memory newContent, uint256 newRating) external nonReentrant whenNotPaused {
        require(hasReview[contractId], unicode"리뷰가 존재하지 않습니다");
        require(reviews[contractId].reviewer == msg.sender, unicode"리뷰 작성자가 아닙니다");
        require(!reviews[contractId].isDeleted, unicode"삭제된 리뷰입니다");
        require(newRating >= 1 && newRating <= 5, unicode"평점은 1에서 5 사이여야 합니다");
        
        Review storage review = reviews[contractId];
        review.content = newContent;
        review.rating = newRating;
        review.qualityScore = _calculateQualityScore(bytes(newContent).length, newRating);
        
        emit ReviewUpdated(contractId, msg.sender);
    }
    
    /**
     * @dev 리뷰 삭제
     * @param contractId 계약 ID
     */
    function deleteReview(uint256 contractId) external nonReentrant whenNotPaused {
        require(hasReview[contractId], unicode"리뷰가 존재하지 않습니다");
        require(reviews[contractId].reviewer == msg.sender, unicode"리뷰 작성자가 아닙니다");
        require(!reviews[contractId].isDeleted, unicode"이미 삭제된 리뷰입니다");
        
        reviews[contractId].isDeleted = true;
        
        emit ReviewDeleted(contractId, msg.sender);
    }
    
    /**
     * @dev 리뷰 신고
     * @param contractId 계약 ID
     */
    function reportReview(uint256 contractId) external nonReentrant whenNotPaused {
        require(hasReview[contractId], unicode"리뷰가 존재하지 않습니다");
        require(!reviews[contractId].isDeleted, unicode"삭제된 리뷰입니다");
        require(!reviewReports[contractId][msg.sender], unicode"이미 신고한 리뷰입니다");
        
        reviews[contractId].reportCount++;
        reviewReports[contractId][msg.sender] = true;
        
        emit ReviewReported(contractId, msg.sender);
    }
    
    /**
     * @dev 품질 점수 계산
     * @param contentLength 내용 길이
     * @param rating 평점
     */
    function _calculateQualityScore(uint256 contentLength, uint256 rating) internal pure returns (uint256) {
        uint256 qualityScore = 1;
        
        // 내용 길이에 따른 점수 조정
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
        
        // 평점에 따른 점수 조정
        qualityScore = (qualityScore * rating) / 5;
        
        return qualityScore;
    }
    
    /**
     * @dev 보험 계약의 리뷰 조회
     * @param contractId 계약 ID
     * @return 리뷰
     */
    function getReview(uint256 contractId) external view returns (Review memory) {
        require(hasReview[contractId], unicode"리뷰가 존재하지 않습니다");
        return reviews[contractId];
    }
    
    // 관리자 함수
    /**
     * @dev 컨트랙트 일시 정지
     */
    function pause() public onlyOwner {
        require(!paused(), unicode"계약이 이미 일시중지 상태입니다");
        _pause();
    }
    
    /**
     * @dev 컨트랙트 정지 해제
     */
    function unpause() public onlyOwner {
        require(paused(), unicode"계약이 이미 활성화 상태입니다");
        _unpause();
    }
    
    /**
     * @dev 보험사 등록 상태 변경
     * @param company 보험사 주소
     * @param status 등록 상태
     */
    function setInsuranceCompanyStatus(address company, bool status) public onlyOwner {
        require(company != address(0), unicode"유효하지 않은 주소입니다");
        insuranceCompanies[company] = status;
        emit InsuranceCompanyStatusChanged(company, status);
    }
    
    /**
     * @dev FunditToken 컨트랙트 주소 설정
     * @param tokenAddress FunditToken 컨트랙트 주소
     */
    function setFunditToken(address tokenAddress) external onlyOwner {
        funditToken = FunditToken(tokenAddress);
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
    function getClaimInfo(uint256 contractId) external view returns (
        uint256 amount,
        string memory description,
        uint256 timestamp,
        uint256 verificationCount,
        uint256 rejectionCount,
        bool processed,
        bool approved,
        bool autoRejected,
        string[] memory evidences
    ) {
        return (
            claimAmounts[contractId],
            claimDescriptions[contractId],
            claimTimestamps[contractId],
            claimVerificationCounts[contractId],
            claimRejectionCounts[contractId],
            claimsProcessed[contractId],
            claimsApproved[contractId],
            claimAutoRejected[contractId],
            claimEvidences[contractId]
        );
    }

    /**
     * @dev 전체 제안 수를 반환합니다.
     * @return 전체 제안 수
     */
    function getProposalCount() public view returns (uint256) {
        return _proposalIds.current();
    }

    /**
     * @dev 전체 계약 수를 반환합니다.
     * @return 전체 계약 수
     */
    function getContractCount() public view returns (uint256) {
        return _contractIds.current();
    }
    
    /**
     * @dev 전체 입찰 수를 반환합니다.
     * @return 전체 입찰 수
     */
    function getBidCount() public view returns (uint256) {
        return _bidIds.current();
    }
    
    /**
     * @dev Oracle 정보 조회
     * @param oracle Oracle 주소
     */
    function getOracleInfo(address oracle) external view returns (
        address oracleAddress,
        bool isActive,
        uint256 trustScore,
        uint256 verificationCount,
        uint256 successCount,
        uint256 rewardBalance,
        uint256 registeredAt
    ) {
        Oracle memory oracleInfo = oracles[oracle];
        return (
            oracleInfo.oracleAddress,
            oracleInfo.isActive,
            oracleInfo.trustScore,
            oracleInfo.verificationCount,
            oracleInfo.successCount,
            oracleInfo.rewardBalance,
            oracleInfo.registeredAt
        );
    }
    
    /**
     * @dev 계약에 할당된 Oracle 목록 조회
     * @param contractId 계약 ID
     */
    function getContractOracles(uint256 contractId) external view returns (address[] memory) {
        return contractOracles[contractId];
    }
}
