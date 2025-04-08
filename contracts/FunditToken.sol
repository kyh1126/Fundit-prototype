// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FunditToken
 * @dev ERC20 token for Fundit DAO rewards
 */
contract FunditToken is ERC20, Ownable {
    // Mapping to track review quality scores
    mapping(address => uint256) public userReviewScores;
    
    // Constants for reward calculation
    uint256 public constant BASE_REVIEW_REWARD = 10 * 10**18; // 10 tokens
    uint256 public constant MAX_REVIEW_REWARD = 50 * 10**18; // 50 tokens
    
    // Events
    event ReviewRewarded(address indexed user, uint256 amount, uint256 qualityScore);
    
    constructor() ERC20("Fundit Token", "FUND") Ownable(msg.sender) {
        // Initial supply can be minted here if needed
    }
    
    /**
     * @dev Mint tokens to an address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Reward a user for writing a review
     * @param user Address of the user
     * @param qualityScore Quality score of the review (1-10)
     */
    function rewardReview(address user, uint256 qualityScore) external onlyOwner {
        require(qualityScore >= 1 && qualityScore <= 10, "Quality score must be between 1 and 10");
        
        // Calculate reward based on quality score
        uint256 reward = BASE_REVIEW_REWARD + ((qualityScore - 1) * (MAX_REVIEW_REWARD - BASE_REVIEW_REWARD) / 9);
        
        // Update user's review score
        userReviewScores[user] = qualityScore;
        
        // Mint and transfer tokens to the user
        _mint(user, reward);
        
        emit ReviewRewarded(user, reward, qualityScore);
    }
    
    /**
     * @dev Get the current review score of a user
     * @param user Address of the user
     * @return The user's review score
     */
    function getUserReviewScore(address user) external view returns (uint256) {
        return userReviewScores[user];
    }
} 