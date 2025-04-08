// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FunditToken
 * @dev DAO 보상용 토큰 컨트랙트
 */
contract FunditToken is ERC20, Ownable, Pausable {
    // 사용자 리뷰 품질 점수 매핑
    mapping(address => uint256) public userReviewScores;
    
    // 사용자 리뷰 수 매핑
    mapping(address => uint256) public userReviewCounts;
    
    // 사용자 총 보상 금액 매핑
    mapping(address => uint256) public userTotalRewards;

    // 기본 리뷰 보상 (10 토큰)
    uint256 public constant BASE_REVIEW_REWARD = 10 * 10**18;
    // 최대 리뷰 보상 (50 토큰)
    uint256 public constant MAX_REVIEW_REWARD = 50 * 10**18;
    
    // 리뷰 품질 점수별 보상 계수 (1점당 5 토큰)
    uint256 public constant REWARD_PER_POINT = 5 * 10**18;
    
    // 연속 리뷰 작성 보너스 (10% 증가)
    uint256 public constant CONTINUOUS_REVIEW_BONUS = 10;
    
    // 최소 리뷰 길이 (50자)
    uint256 public constant MIN_REVIEW_LENGTH = 50;
    
    // 최소 리뷰 정보 점수 (3점)
    uint256 public constant MIN_INFO_SCORE = 3;

    // 리뷰 보상 이벤트
    event ReviewRewarded(address indexed user, uint256 amount, uint256 score, uint256 reviewCount);
    
    // 토큰 발행 이벤트
    event TokensMinted(address indexed to, uint256 amount, string reason);

    constructor() ERC20("Fundit Token", "FUND") Ownable(msg.sender) {}

    /**
     * @dev 토큰 발행
     * @param to 수신자 주소
     * @param amount 발행량
     */
    function mint(address to, uint256 amount) public onlyOwner whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount, "관리자 발행");
    }

    /**
     * @dev 리뷰 보상 지급
     * @param user 사용자 주소
     * @param score 리뷰 품질 점수 (1-10)
     */
    function rewardReview(address user, uint256 score) public onlyOwner whenNotPaused {
        require(score >= 1 && score <= 10, "점수는 1에서 10 사이여야 합니다");
        
        // 점수에 따른 보상 계산
        uint256 baseReward = BASE_REVIEW_REWARD + ((score - 1) * REWARD_PER_POINT);
        
        // 연속 리뷰 작성 보너스 계산
        uint256 continuousBonus = 0;
        if (userReviewCounts[user] > 0) {
            continuousBonus = (baseReward * CONTINUOUS_REVIEW_BONUS) / 100;
        }
        
        // 총 보상 계산
        uint256 totalReward = baseReward + continuousBonus;
        require(totalReward <= MAX_REVIEW_REWARD, "보상이 최대 한도를 초과합니다");

        // 사용자 정보 업데이트
        userReviewScores[user] = score;
        userReviewCounts[user]++;
        userTotalRewards[user] += totalReward;
        
        // 토큰 발행
        _mint(user, totalReward);

        emit ReviewRewarded(user, totalReward, score, userReviewCounts[user]);
    }
    
    /**
     * @dev 추가 정보 보상 지급
     * @param user 사용자 주소
     * @param infoScore 정보 점수 (1-10)
     */
    function rewardAdditionalInfo(address user, uint256 infoScore) public onlyOwner whenNotPaused {
        require(infoScore >= MIN_INFO_SCORE && infoScore <= 10, "정보 점수는 3에서 10 사이여야 합니다");
        
        // 정보 점수에 따른 보상 계산 (최대 20 토큰)
        uint256 infoReward = ((infoScore - MIN_INFO_SCORE + 1) * 2 * 10**18);
        
        // 사용자 정보 업데이트
        userTotalRewards[user] += infoReward;
        
        // 토큰 발행
        _mint(user, infoReward);
        
        emit TokensMinted(user, infoReward, "추가 정보 보상");
    }

    /**
     * @dev 사용자 리뷰 점수 조회
     * @param user 사용자 주소
     * @return 사용자의 현재 리뷰 점수
     */
    function getUserReviewScore(address user) public view returns (uint256) {
        return userReviewScores[user];
    }
    
    /**
     * @dev 사용자 리뷰 수 조회
     * @param user 사용자 주소
     * @return 사용자의 리뷰 수
     */
    function getUserReviewCount(address user) public view returns (uint256) {
        return userReviewCounts[user];
    }
    
    /**
     * @dev 사용자 총 보상 금액 조회
     * @param user 사용자 주소
     * @return 사용자의 총 보상 금액
     */
    function getUserTotalRewards(address user) public view returns (uint256) {
        return userTotalRewards[user];
    }
    
    /**
     * @dev 컨트랙트 일시 중지
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev 컨트랙트 재개
     */
    function unpause() public onlyOwner {
        _unpause();
    }
} 