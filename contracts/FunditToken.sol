// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FunditToken
 * @dev DAO 보상용 토큰 컨트랙트
 */
contract FunditToken is ERC20, Ownable {
    // 사용자 리뷰 품질 점수 매핑
    mapping(address => uint256) public userReviewScores;
    
    // 기본 리뷰 보상 (10 토큰)
    uint256 public constant BASE_REVIEW_REWARD = 10 * 10**18;
    // 최대 리뷰 보상 (50 토큰)
    uint256 public constant MAX_REVIEW_REWARD = 50 * 10**18;
    
    // 리뷰 보상 이벤트
    event ReviewRewarded(address indexed user, uint256 amount, uint256 score);
    
    constructor() ERC20("Fundit Token", "FUND") Ownable(msg.sender) {
        // Initial supply can be minted here if needed
    }
    
    /**
     * @dev 토큰 발행
     * @param to 수신자 주소
     * @param amount 발행량
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 리뷰 보상 지급
     * @param user 사용자 주소
     * @param score 리뷰 품질 점수 (1-10)
     */
    function rewardReview(address user, uint256 score) public onlyOwner {
        require(score >= 1 && score <= 10, "점수는 1에서 10 사이여야 합니다");
        
        // 점수에 따른 보상 계산 (1점당 5 토큰)
        uint256 reward = BASE_REVIEW_REWARD + ((score - 1) * 5 * 10**18);
        require(reward <= MAX_REVIEW_REWARD, "보상이 최대 한도를 초과합니다");
        
        userReviewScores[user] = score;
        _mint(user, reward);
        
        emit ReviewRewarded(user, reward, score);
    }
    
    /**
     * @dev 사용자 리뷰 점수 조회
     * @param user 사용자 주소
     * @return 사용자의 현재 리뷰 점수
     */
    function getUserReviewScore(address user) public view returns (uint256) {
        return userReviewScores[user];
    }
} 