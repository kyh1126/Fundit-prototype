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

    // 리뷰 품질 평가 관련 상수
    uint256 public constant MIN_REVIEW_LENGTH = 100;  // 최소 리뷰 길이 (100자)
    uint256 public constant MAX_REVIEW_LENGTH = 2000; // 최대 리뷰 길이 (2000자)
    uint256 public constant MIN_RATING = 1;           // 최소 평점
    uint256 public constant MAX_RATING = 5;           // 최대 평점
    uint256 public constant BASE_REVIEW_REWARD = 10 * 10**18;  // 기본 리뷰 보상 (10 토큰)
    uint256 public constant MAX_REVIEW_REWARD = 50 * 10**18;   // 최대 리뷰 보상 (50 토큰)
    uint256 public constant REWARD_PER_POINT = 5 * 10**18;     // 점수당 보상 (5 토큰)
    uint256 public constant CONTINUOUS_REVIEW_BONUS = 10;      // 연속 리뷰 보너스 (10%)
    
    // 리뷰 품질 점수 계산 함수
    function calculateReviewScore(
        string memory content,
        uint256 rating,
        uint256 userReviewCount
    ) public pure returns (uint256) {
        // 내용 길이 점수 계산
        uint256 contentLength = bytes(content).length;
        require(contentLength >= MIN_REVIEW_LENGTH, unicode"리뷰가 너무 짧습니다");
        require(contentLength <= MAX_REVIEW_LENGTH, unicode"리뷰가 너무 깁니다");
        
        uint256 lengthScore;
        if (contentLength >= 1000) {
            lengthScore = 10;
        } else if (contentLength >= 500) {
            lengthScore = 8;
        } else if (contentLength >= 300) {
            lengthScore = 6;
        } else if (contentLength >= 200) {
            lengthScore = 4;
        } else {
            lengthScore = 2;
        }
        
        // 평점 검증
        require(rating >= MIN_RATING && rating <= MAX_RATING, unicode"유효하지 않은 평점입니다");
        
        // 기본 점수 계산 (길이 점수 * 평점)
        uint256 baseScore = (lengthScore * rating) / MAX_RATING;
        
        // 연속 리뷰 보너스 계산
        uint256 continuousBonus = 0;
        if (userReviewCount > 0) {
            continuousBonus = (baseScore * CONTINUOUS_REVIEW_BONUS) / 100;
        }
        
        // 최종 점수 계산
        uint256 finalScore = baseScore + continuousBonus;
        require(finalScore <= 10, unicode"최대 점수를 초과했습니다");
        
        return finalScore;
    }
    
    // 리뷰 보상 이벤트
    event ReviewRewarded(address indexed user, uint256 amount, uint256 score, uint256 reviewCount);
    
    // 토큰 발행 이벤트
    event TokensMinted(address indexed to, uint256 amount, string reason);

    constructor() ERC20("Fundit Token", "FUND") Ownable() {}

    /**
     * @dev 토큰 발행
     * @param to 수신자 주소
     * @param amount 발행량
     */
    function mint(address to, uint256 amount) public onlyOwner whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount, unicode"관리자 발행");
    }

    /**
     * @dev 리뷰 보상 지급
     * @param user 사용자 주소
     * @param content 리뷰 내용
     * @param rating 평점 (1-5)
     */
    function rewardReview(
        address user,
        string memory content,
        uint256 rating
    ) public whenNotPaused {
        // 리뷰 품질 점수 계산
        uint256 qualityScore = calculateReviewScore(content, rating, userReviewCounts[user]);
        
        // 보상 계산
        uint256 baseReward = BASE_REVIEW_REWARD + ((qualityScore - 1) * REWARD_PER_POINT);
        require(baseReward <= MAX_REVIEW_REWARD, unicode"보상이 최대 한도를 초과합니다");
        
        // 사용자 정보 업데이트
        userReviewScores[user] = qualityScore;
        userReviewCounts[user]++;
        userTotalRewards[user] += baseReward;
        
        // 토큰 발행
        _mint(user, baseReward);
        
        emit ReviewRewarded(user, baseReward, qualityScore, userReviewCounts[user]);
    }
    
    /**
     * @dev 추가 정보 보상 지급
     * @param user 사용자 주소
     * @param infoScore 정보 점수 (1-10)
     */
    function rewardAdditionalInfo(address user, uint256 infoScore) public onlyOwner whenNotPaused {
        require(infoScore >= 3 && infoScore <= 10, unicode"정보 점수는 3에서 10 사이여야 합니다");
        
        // 정보 점수에 따른 보상 계산 (최대 20 토큰)
        uint256 infoReward = ((infoScore - 3 + 1) * 2 * 10**18);
        
        // 사용자 정보 업데이트
        userTotalRewards[user] += infoReward;
        
        // 토큰 발행
        _mint(user, infoReward);
        
        emit TokensMinted(user, infoReward, unicode"추가 정보 보상");
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