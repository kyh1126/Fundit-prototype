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
        uint256 id;
        address proposer;
        string title;
        uint256 premium;
        uint256 coverage;
        uint256 duration;
        uint256 deadline;
        string description;
        ProposalStatus status;
        bool exists;
    }
    
    struct Bid {
        uint256 id;
        uint256 proposalId;
        address insurer;
        uint256 premium;
        uint256 coverage;
        string terms;
        bool active;
        bool exists;
    }
    
    struct Contract {
        uint256 id;
        uint256 proposalId;
        uint256 bidId;
        address proposer;
        address insurer;
        uint256 premium;
        uint256 coverage;
        uint256 startTime;
        uint256 endTime;
        ContractStatus status;
        bool claimed;
        bool underReview;
        bool exists;
    }
    
    struct Review {
        uint256 id;
        uint256 contractId;
        address reviewer;
        uint256 rating;
        string content;
        uint256 timestamp;
        bool underReview;
        bool exists;
    }
    
    struct ReviewReport {
        address reporter;
        string reason;
        uint256 timestamp;
    }
    
    struct Oracle {
        bool registered;
        uint256 trustScore;
        uint256 verificationCount;
        uint256 successCount;
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
    mapping(uint256 => Claim) public claims;                     // 청구 정보
    mapping(address => Oracle) public oracles;                   // 오라클 정보
    mapping(uint256 => ReviewReport) public reviewReports;       // 리뷰 신고 정보
    mapping(uint256 => uint256) private claimAmounts;            // 청구 금액
    mapping(uint256 => uint256) private claimVerificationCounts; // 검증 횟수
    mapping(uint256 => uint256) private claimRejectionCounts;    // 거부 횟수
    mapping(uint256 => bool) private claimAutoRejected;          // 자동 거부 여부
    mapping(uint256 => bool) private claimsProcessed;            // 처리된 청구
    mapping(uint256 => bool) private claimsApproved;             // 승인된 청구
    mapping(uint256 => address[]) private contractOracles;       // 계약별 오라클 목록
    mapping(uint256 => mapping(address => bool)) private oracleVerifications; // 오라클 검증 결과
    mapping(address => bool) public registeredOracles;           // 등록된 오라클
    mapping(uint256 => uint256) public claimTimestamps;         // 청구 시간
    mapping(uint256 => string) public claimDescriptions;        // 청구 설명
    mapping(uint256 => string[]) public claimEvidences;         // 청구 증거
    mapping(uint256 => mapping(address => string)) public oracleEvidences;   // 오라클 증거
    
    // 리뷰 관련 변수
    mapping(uint256 => Review) public reviews;                   // 리뷰 정보
    mapping(uint256 => bool) public hasReview;                   // 리뷰 존재 여부
    
    // 토큰 컨트랙트
    FunditToken public funditToken;
    
    // 이벤트
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 premium, uint256 coverage, uint256 duration);
    event ProposalCancelled(uint256 indexed proposalId, address indexed proposer);
    event BidSubmitted(uint256 indexed proposalId, address indexed bidder, uint256 premium);
    event ContractCreated(
        uint256 indexed contractId,
        uint256 indexed proposalId,
        uint256 indexed bidId,
        address proposer,
        address insurer
    );
    event ClaimSubmitted(uint256 indexed contractId, address indexed claimer, uint256 amount);
    event OracleRegistered(address indexed oracle);
    event OracleUnregistered(address indexed oracle);
    event OracleStatusChanged(address indexed oracle, bool status);
    event InsuranceCompanyRegistered(address indexed company);
    event InsuranceCompanyStatusChanged(address indexed company, bool status);
    event OracleVerificationSubmitted(uint256 indexed contractId, address indexed oracle, bool isValid);
    event ReviewSubmitted(uint256 indexed contractId, address indexed reviewer, string content, uint256 rating);
    event ReviewRewarded(uint256 indexed contractId, address indexed reviewer, uint256 amount);
    event ContractExpired(uint256 indexed contractId);
    event ContractTerminated(uint256 indexed contractId);
    event ContractReactivated(uint256 indexed contractId);
    event ReviewModified(uint256 indexed reviewId);
    event ReviewDeleted(uint256 indexed reviewId);
    event ReviewReported(uint256 indexed reviewId, address indexed reporter, string reason);
    event ReviewReportHandled(uint256 indexed reviewId, bool shouldDelete);
    event ProposalModified(uint256 indexed proposalId);
    event InsurancePaid(uint256 indexed contractId, uint256 amount);
    event OracleAssigned(uint256 indexed contractId, address indexed oracle);
    
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
    
    enum ContractStatus {
        None,       // 0: 존재하지 않음
        Active,     // 1: 활성화
        Terminated, // 2: 해지됨
        Expired,    // 3: 만료됨
        Completed   // 4: 완료됨
    }
    
    enum ProposalStatus {
        None,       // 초기 상태
        Active,     // 활성화
        UnderReview,// 검토 중
        Completed,  // 완료됨
        Cancelled,  // 취소됨
        Expired,    // 만료됨
        Terminated  // 해지됨
    }
    
    struct Claim {
        uint256 id;
        uint256 contractId;
        uint256 amount;
        string description;
        string evidence;
        uint256 timestamp;
        bool processed;
        bool approved;
        bool paid;
        uint256 verificationCount;
        uint256 rejectionCount;
        bool exists;
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
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(premium > 0, "Premium must be greater than 0");
        require(coverage > 0, "Coverage must be greater than 0");
        require(coverage > premium, "Coverage must be greater than premium");
        require(duration >= MIN_PROPOSAL_DURATION, "Duration must be greater than minimum allowed");
        require(duration <= MAX_PROPOSAL_DURATION, "Duration must be less than maximum allowed");

        _proposalIds.increment();
        uint256 proposalId = _proposalIds.current();

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            premium: premium,
            coverage: coverage,
            duration: duration,
            deadline: block.timestamp + duration,
            description: description,
            status: ProposalStatus.Active,
            exists: true
        });

        emit ProposalCreated(proposalId, msg.sender, premium, coverage, duration);
        return proposalId;
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
        uint256 duration,
        bool active,
        bool exists
    ) {
        require(proposals[proposalId].exists, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.premium,
            proposal.coverage,
            proposal.duration,
            proposal.status == ProposalStatus.Active,
            proposal.exists
        );
    }
    
    /**
     * @dev 제안 취소
     * @param proposalId 제안 ID
     */
    function cancelProposal(uint256 proposalId) public whenNotPaused nonReentrant {
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(proposals[proposalId].proposer == msg.sender, "Only proposer can cancel proposal");
        require(proposalBids[proposalId].length == 0, "Cannot cancel proposal with bids");

        proposals[proposalId].status = ProposalStatus.Cancelled;
        emit ProposalCancelled(proposalId, msg.sender);
    }
    
    /**
     * @dev 제안 수정
     * @param proposalId 제안 ID
     * @param title 제안 제목
     * @param description 제안 설명
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param duration 제안 기간 (일)
     */
    function modifyProposal(
        uint256 proposalId,
        string memory title,
        string memory description,
        uint256 premium,
        uint256 coverage,
        uint256 duration
    ) public whenNotPaused nonReentrant {
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(proposals[proposalId].proposer == msg.sender, "Only proposer can modify proposal");
        require(proposals[proposalId].status == ProposalStatus.Active, "Only active proposal can be modified");
        require(proposalBids[proposalId].length == 0, "Cannot modify proposal with bids");
        require(duration >= MIN_PROPOSAL_DURATION && duration <= MAX_PROPOSAL_DURATION, "Invalid duration");
        require(premium > 0, "Premium must be greater than 0");
        require(coverage > 0, "Coverage must be greater than 0");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        proposals[proposalId].title = title;
        proposals[proposalId].description = description;
        proposals[proposalId].premium = premium;
        proposals[proposalId].coverage = coverage;
        proposals[proposalId].duration = duration;
        proposals[proposalId].deadline = block.timestamp + duration;

        emit ProposalModified(proposalId);
    }
    
    // 입찰 관련 함수
    /**
     * @dev 보험사 등록
     */
    function registerInsuranceCompany() external {
        require(!insuranceCompanies[msg.sender], "Company already registered");
        insuranceCompanies[msg.sender] = true;
        emit InsuranceCompanyRegistered(msg.sender);
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
        require(insuranceCompanies[msg.sender], "Only registered insurance company can place bid");
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(proposals[proposalId].status == ProposalStatus.Active, "Proposal is not active");
        require(block.timestamp <= proposals[proposalId].deadline, "Proposal deadline has passed");
        require(premium > 0, "Premium must be greater than 0");
        require(coverage > 0, "Coverage must be greater than 0");
        require(bytes(terms).length > 0, "Terms cannot be empty");

        _bidIds.increment();
        uint256 bidId = _bidIds.current();

        Bid memory bid = Bid({
            id: bidId,
            proposalId: proposalId,
            insurer: msg.sender,
            premium: premium,
            coverage: coverage,
            terms: terms,
            active: true,
            exists: true
        });

        bids[bidId] = bid;
        proposalBids[proposalId].push(bid);
        companyBids[msg.sender].push(bidId);
        
        emit BidSubmitted(proposalId, msg.sender, premium);
        
        return bidId;
    }
    
    /**
     * @dev 입찰 상세 정보 조회
     * @param proposalId 제안 ID
     * @param bidId 입찰 ID
     */
    function getBid(
        uint256 proposalId,
        uint256 bidId
    ) public view returns (
        uint256 id,
        uint256 proposalId_,
        address insurer,
        uint256 premium,
        uint256 coverage,
        string memory terms,
        bool active,
        bool exists
    ) {
        Bid memory bid = bids[bidId];
        return (
            bid.id,
            bid.proposalId,
            bid.insurer,
            bid.premium,
            bid.coverage,
            bid.terms,
            bid.active,
            bid.exists
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
     * @dev 입찰 취소
     * @param proposalId 제안 ID
     * @param bidId 입찰 ID
     */
    function cancelBid(uint256 proposalId, uint256 bidId) public whenNotPaused nonReentrant {
        require(bids[bidId].exists, "Bid does not exist");
        require(bids[bidId].proposalId == proposalId, "Bid is not for the specified proposal");
        require(bids[bidId].insurer == msg.sender, "Only bidder can cancel bid");
        require(bids[bidId].active, "Bid is already inactive");

        bids[bidId].active = false;
    }
    
    /**
     * @dev 입찰 수정
     * @param proposalId 제안 ID
     * @param bidId 입찰 ID
     * @param premium 보험료
     * @param coverage 보장 금액
     * @param terms 입찰 조건
     */
    function modifyBid(
        uint256 proposalId,
        uint256 bidId,
        uint256 premium,
        uint256 coverage,
        string memory terms
    ) public whenNotPaused nonReentrant {
        require(insuranceCompanies[msg.sender], "Only registered insurance company can modify bid");
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(proposals[proposalId].status == ProposalStatus.Active, "Proposal is not active");
        require(block.timestamp <= proposals[proposalId].deadline, "Bid period has ended");
        require(bids[bidId].exists, "Bid does not exist");
        require(bids[bidId].insurer == msg.sender, "Only bidder can modify bid");
        require(bids[bidId].active, "Bid is already inactive");
        require(premium > 0, "Premium must be greater than 0");
        require(coverage > 0, "Coverage must be greater than 0");
        require(bytes(terms).length > 0, "Terms cannot be empty");

        bids[bidId].premium = premium;
        bids[bidId].coverage = coverage;
        bids[bidId].terms = terms;
    }
    
    // 계약 관련 함수
    /**
     * @dev 입찰 수락 및 계약 체결
     * @param proposalId 제안 ID
     * @param bidId 입찰 ID
     */
    function acceptBid(uint256 proposalId, uint256 bidId) external {
        require(proposals[proposalId].exists, "Proposal does not exist");
        require(proposals[proposalId].status == ProposalStatus.Active, "Proposal is not active");
        require(proposals[proposalId].proposer == msg.sender, "Only proposer can accept bid");
        require(bids[bidId].exists, "Bid does not exist");
        require(bids[bidId].active, "Bid is already inactive");

        _contractIds.increment();
        uint256 contractId = _contractIds.current();

        contracts[contractId] = Contract({
            id: contractId,
            proposalId: proposalId,
            bidId: bidId,
            proposer: msg.sender,
            insurer: bids[bidId].insurer,
            premium: bids[bidId].premium,
            coverage: bids[bidId].coverage,
            startTime: block.timestamp,
            endTime: block.timestamp + proposals[proposalId].duration,
            status: ContractStatus.Active,
            claimed: false,
            underReview: false,
            exists: true
        });

        proposals[proposalId].status = ProposalStatus.Completed;
        bids[bidId].active = false;

        emit ContractCreated(contractId, proposalId, bidId, msg.sender, bids[bidId].insurer);
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
        address insurer,
        uint256 premium,
        uint256 coverage,
        uint256 startTime,
        uint256 endTime,
        ContractStatus status,
        bool claimed
    ) {
        require(contracts[contractId].exists, "Contract does not exist");
        Contract memory contract_ = contracts[contractId];
        return (
            contract_.id,
            contract_.proposalId,
            contract_.bidId,
            contract_.proposer,
            contract_.insurer,
            contract_.premium,
            contract_.coverage,
            contract_.startTime,
            contract_.endTime,
            contract_.status,
            contract_.claimed
        );
    }
    
    // 보험금 청구 및 지급 관련 함수
    /**
     * @dev 보험금 청구 제출
     * @param contractId 계약 ID
     * @param amount 청구 금액
     * @param description 청구 설명
     * @param evidence 청구 증거
     */
    function submitClaim(
        uint256 contractId,
        uint256 amount,
        string memory description,
        string memory evidence
    ) public whenNotPaused nonReentrant {
        require(contracts[contractId].exists, "Contract does not exist");
        require(contracts[contractId].proposer == msg.sender, "Only proposer can submit claim");
        require(!contracts[contractId].claimed, "Claim already submitted");
        require(amount <= contracts[contractId].coverage, "Amount exceeds coverage");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(evidence).length > 0, "Evidence cannot be empty");

        contracts[contractId].claimed = true;
        claimAmounts[contractId] = amount;
        claimDescriptions[contractId] = description;
        claimEvidences[contractId].push(evidence);
        claimTimestamps[contractId] = block.timestamp;

        emit ClaimSubmitted(contractId, msg.sender, amount);
    }
    
    /**
     * @dev Oracle 검증 제출
     * @param contractId 계약 ID
     * @param result 검증 결과
     * @param evidence 검증 증거
     */
    function submitOracleVerification(
        uint256 contractId,
        bool result,
        string memory evidence
    ) public whenNotPaused nonReentrant {
        require(contracts[contractId].exists, "Contract does not exist");
        require(registeredOracles[msg.sender], "Only registered oracle can submit verification");
        require(!oracleVerifications[contractId][msg.sender], "Verification already submitted");
        require(contracts[contractId].claimed, "Claim not submitted");
        
        oracleVerifications[contractId][msg.sender] = result;
        oracleEvidences[contractId][msg.sender] = evidence;
        claimVerificationCounts[contractId]++;
        contractOracles[contractId].push(msg.sender);
        
        // 검증 결과 처리
        if (!result) {
            claimRejectionCounts[contractId]++;
            if (claimRejectionCounts[contractId] >= MAX_REJECTION_COUNT) {
                claimAutoRejected[contractId] = true;
                _processClaim(contractId, false);
                return;
            }
        }

        // 최소 검증 횟수를 충족하면 청구를 처리
        if (claimVerificationCounts[contractId] >= MIN_VERIFICATION_COUNT) {
            _processClaim(contractId, result);
        }

        emit OracleVerificationSubmitted(contractId, msg.sender, result);
    }
    
    /**
     * @dev 내부 청구 처리 함수
     * @param contractId 계약 ID
     * @param approved 승인 여부
     */
    function _processClaim(uint256 contractId, bool approved) internal {
        require(claimVerificationCounts[contractId] >= MIN_VERIFICATION_COUNT, "Insufficient verification");
        require(!claimsProcessed[contractId], "Claim already processed");
        
        claimsApproved[contractId] = approved;
        claimsProcessed[contractId] = true;
        
        // Update oracle trust scores and distribute rewards
        uint256 totalVerifications = claimVerificationCounts[contractId];
        if (totalVerifications > 0 && claimAmounts[contractId] > 0) {
            uint256 rewardPerOracle = (claimAmounts[contractId] * 1) / 100 / totalVerifications; // 1% of claim amount as reward
            
            for (uint256 i = 0; i < totalVerifications; i++) {
                address oracleAddr = contractOracles[contractId][i];
                bool oracleVerification = oracleVerifications[contractId][oracleAddr];
                
                // Update trust score
                if (oracleVerification == approved) {
                    oracles[oracleAddr].trustScore += 1;
                    oracles[oracleAddr].successCount += 1;
                }
                oracles[oracleAddr].verificationCount += 1;
            }
        }
        
        emit ClaimSubmitted(contractId, msg.sender, claimAmounts[contractId]);
        
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
        require(registeredOracles[oracleAddress], "Oracle is not registered");
        contractOracles[contractId].push(oracleAddress);
        emit OracleAssigned(contractId, oracleAddress);
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
        
        // Transfer the claim amount to the recipient
        payable(recipient).transfer(amount);
        
        emit InsurancePaid(contractId, amount);
    }
    

    /**
     * @dev 제안에 대한 모든 입찰 조회
     * @param proposalId 제안 ID
     */
    function getBids(uint256 proposalId) public view returns (Bid[] memory) {
        return proposalBids[proposalId];
    }
    
    // 관리자 함수
    /**
     * @dev 컨트랙트 일시 정지
     */
    function pause() public onlyOwner {
        require(!paused(), "Contract is already paused");
        _pause();
    }
    
    /**
     * @dev 컨트랙트 정지 해제
     */
    function unpause() public onlyOwner {
        require(paused(), "Contract is already unpaused");
        _unpause();
    }
    
    /**
     * @dev 보험사 등록 상태 변경
     * @param company 보험사 주소
     * @param status 등록 상태
     */
    function setInsuranceCompanyStatus(address company, bool status) public onlyOwner {
        require(company != address(0), "Invalid address");
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
     * @dev 보험 계약에 대한 리뷰 제출
     * @param contractId 계약 ID
     * @param content 리뷰 내용
     * @param rating 평점 (1-5)
     */
    function submitReview(uint256 contractId, string memory content, uint256 rating) public {
        require(contracts[contractId].exists, "Contract does not exist");
        require(contracts[contractId].proposer == msg.sender, "Only contract owner can submit review");
        require(!hasReview[contractId], "Review already submitted");
        require(bytes(content).length > 0, "Review content cannot be empty");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");

        // Create review
        reviews[contractId] = Review({
            id: contractId,
            contractId: contractId,
            reviewer: msg.sender,
            rating: rating,
            content: content,
            timestamp: block.timestamp,
            underReview: false,
            exists: true
        });

        hasReview[contractId] = true;
        emit ReviewSubmitted(contractId, msg.sender, content, rating);

        // 리뷰 보상 지급
        if (address(funditToken) != address(0)) {
            funditToken.rewardReview(msg.sender, content, rating);
            emit ReviewRewarded(contractId, msg.sender, funditToken.getUserTotalRewards(msg.sender));
        }
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
        require(contracts[contractId].exists, "Contract does not exist");
        require(contracts[contractId].proposer == msg.sender, "Only proposer can add evidence");
        require(!claimsProcessed[contractId], "Claim already processed");
        require(bytes(evidence).length >= EVIDENCE_REQUIRED_LENGTH, "Evidence length must be greater than or equal to required length");
        
        claimEvidences[contractId].push(evidence);
    }
    
    /**
     * @dev Oracle을 등록합니다.
     * @param oracle Oracle 주소
     */
    function registerOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Invalid Oracle address");
        require(!registeredOracles[oracle], "Oracle already registered");
        registeredOracles[oracle] = true;
        emit OracleRegistered(oracle);
    }

    /**
     * @dev Oracle을 등록 해제합니다.
     * @param oracle Oracle 주소
     */
    function unregisterOracle(address oracle) external onlyOwner {
        require(registeredOracles[oracle], "Oracle is not registered");
        registeredOracles[oracle] = false;
        emit OracleUnregistered(oracle);
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
     * @dev Oracle 등록 상태를 설정합니다
     * @param oracle Oracle 주소
     * @param status 등록 상태
     */
    function setOracleStatus(address oracle, bool status) external onlyOwner {
        require(oracle != address(0), "Invalid Oracle address");
        registeredOracles[oracle] = status;
        emit OracleStatusChanged(oracle, status);
    }

    /**
     * @dev 청구 정보 조회
     * @param contractId 계약 ID
     */
    function getClaimInfo(uint256 contractId) public view returns (
        uint256 amount,
        string memory description,
        string[] memory evidences,
        uint256 timestamp,
        bool processed,
        bool approved,
        uint256 verificationCount,
        uint256 rejectionCount
    ) {
        return (
            claimAmounts[contractId],
            claimDescriptions[contractId],
            claimEvidences[contractId],
            claimTimestamps[contractId],
            claimsProcessed[contractId],
            claimsApproved[contractId],
            claimVerificationCounts[contractId],
            claimRejectionCounts[contractId]
        );
    }

    // 계약 만료 처리
    function processExpiredContracts() external {
        uint256 contractCount = _contractIds.current();
        for (uint256 i = 1; i <= contractCount; i++) {
            Contract storage contract_ = contracts[i];
            if (contract_.status == ContractStatus.Active && block.timestamp >= contract_.endTime) {
                contract_.status = ContractStatus.Expired;
                emit ContractExpired(i);
            }
        }
    }

    /**
     * @dev 계약 해지
     * @param contractId 계약 ID
     */
    function terminateContract(uint256 contractId) public whenNotPaused nonReentrant {
        require(contracts[contractId].exists, "Contract does not exist");
        require(contracts[contractId].status == ContractStatus.Active, "Only active contract can be terminated");
        require(
            contracts[contractId].proposer == msg.sender || contracts[contractId].insurer == msg.sender,
            "Only contract parties can terminate contract"
        );
        require(!contracts[contractId].claimed, "Claimed contract cannot be terminated");

        contracts[contractId].status = ContractStatus.Terminated;
        emit ContractTerminated(contractId);
    }

    // 계약 재활성화
    function reactivateContract(uint256 contractId) external {
        Contract storage contract_ = contracts[contractId];
        require(contract_.status == ContractStatus.Terminated, "Only terminated contract can be reactivated");
        require(msg.sender == contract_.proposer || msg.sender == contract_.insurer, "Only contract parties can reactivate contract");
        
        contract_.status = ContractStatus.Active;
        emit ContractReactivated(contractId);
    }

    // 청구 정보 조회
    function getClaim(uint256 claimId) external view returns (
        uint256 amount,
        string memory description,
        string memory evidence,
        uint256 timestamp,
        bool processed,
        bool approved,
        bool paid,
        uint256 verificationCount,
        uint256 rejectionCount
    ) {
        Claim storage claim = claims[claimId];
        return (
            claim.amount,
            claim.description,
            claim.evidence,
            claim.timestamp,
            claim.processed,
            claim.approved,
            claim.paid,
            claim.verificationCount,
            claim.rejectionCount
        );
    }

    // 오라클 정보 조회
    function getOracle(address oracleAddress) external view returns (
        bool registered,
        uint256 trustScore,
        uint256 verificationCount,
        uint256 successCount
    ) {
        Oracle storage oracle = oracles[oracleAddress];
        return (
            oracle.registered,
            oracle.trustScore,
            oracle.verificationCount,
            oracle.successCount
        );
    }

    /**
     * @dev 리뷰 수정
     * @param reviewId 리뷰 ID
     * @param content 리뷰 내용
     * @param rating 리뷰 평점
     */
    function modifyReview(
        uint256 reviewId,
        string memory content,
        uint256 rating
    ) public whenNotPaused nonReentrant {
        require(reviews[reviewId].exists, "Review does not exist");
        require(reviews[reviewId].reviewer == msg.sender, "Only review author can modify");
        require(!reviews[reviewId].underReview, "Cannot modify review under investigation");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(bytes(content).length > 0, "Content cannot be empty");

        reviews[reviewId].content = content;
        reviews[reviewId].rating = rating;
        reviews[reviewId].timestamp = block.timestamp;

        emit ReviewModified(reviewId);
    }

    /**
     * @dev 리뷰 삭제
     * @param reviewId 리뷰 ID
     */
    function deleteReview(uint256 reviewId) public whenNotPaused nonReentrant {
        require(reviews[reviewId].exists, "Review does not exist");
        require(reviews[reviewId].reviewer == msg.sender, "Only review author can delete");
        require(!reviews[reviewId].underReview, "Cannot delete review under investigation");

        reviews[reviewId].exists = false;
        reviews[reviewId].content = "";
        reviews[reviewId].rating = 0;

        emit ReviewDeleted(reviewId);
    }

    /**
     * @dev 리뷰 신고
     * @param reviewId 리뷰 ID
     * @param reason 신고 사유
     */
    function reportReview(
        uint256 reviewId,
        string memory reason
    ) public whenNotPaused nonReentrant {
        require(reviews[reviewId].exists, "Review does not exist");
        require(reviews[reviewId].reviewer != msg.sender, "Cannot report own review");
        require(!reviews[reviewId].underReview, "Review already under investigation");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        reviews[reviewId].underReview = true;

        emit ReviewReported(reviewId, msg.sender, reason);
    }

    /**
     * @dev 리뷰 신고 처리 (관리자만 가능)
     * @param reviewId 리뷰 ID
     * @param shouldDelete 삭제 여부
     */
    function handleReviewReport(
        uint256 reviewId,
        bool shouldDelete
    ) public onlyOwner whenNotPaused nonReentrant {
        require(reviews[reviewId].exists, "Review does not exist");
        require(reviews[reviewId].underReview, "Review is not under review");

        if (shouldDelete) {
            reviews[reviewId].exists = false;
            reviews[reviewId].content = "";
            reviews[reviewId].rating = 0;
            reviews[reviewId].underReview = false;
            emit ReviewDeleted(reviewId);
        } else {
            reviews[reviewId].underReview = false;
        }

        emit ReviewReportHandled(reviewId, shouldDelete);
    }

    function getContracts() public view returns (Contract[] memory) {
        uint256 contractCount = _contractIds.current();
        Contract[] memory allContracts = new Contract[](contractCount);
        
        for (uint256 i = 0; i < contractCount; i++) {
            allContracts[i] = contracts[i + 1];
        }
        
        return allContracts;
    }

    function _verifyClaimEvidence(
        string memory evidence,
        uint256 verificationCount
    ) internal pure returns (bool) {
        // 증거 검증 로직
        // 현재는 단순히 증거가 비어있지 않고 검증 횟수가 충분한지만 확인
        return bytes(evidence).length > 0 && verificationCount >= MIN_VERIFICATION_COUNT;
    }

    function _refundBidDeposit(uint256 contractId) internal {
        // 입찰 보증금 환불
        uint256 depositAmount = contracts[contractId].premium;
        address bidder = contracts[contractId].insurer;
        
        // 보증금이 있는 경우에만 환불
        if (depositAmount > 0) {
            // 보증금을 0으로 설정
            contracts[contractId].premium = 0;
            
            // 보증금 환불
            (bool success, ) = bidder.call{value: depositAmount}("");
            require(success, "Refund failed");
        }
    }
}
