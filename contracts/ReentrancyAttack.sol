// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ReentrancyAttack {
    IFundit public fundit;
    bool private _reentrancyGuard;

    constructor(address _fundit) {
        fundit = IFundit(_fundit);
    }

    function execute() external {
        require(!_reentrancyGuard, "ReentrancyGuard: reentrant call");
        _reentrancyGuard = true;
        
        // 공격 시도
        fundit.proposeInsurance(
            "Attack",
            "Attack Description",
            1 ether,
            10 ether,
            30 days
        );
        
        _reentrancyGuard = false;
    }
}

interface IFundit {
    function proposeInsurance(
        string memory title,
        string memory description,
        uint256 premium,
        uint256 coverage,
        uint256 duration
    ) external;
} 