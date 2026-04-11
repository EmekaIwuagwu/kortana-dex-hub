// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IMonoDEX {
    function lpBalanceOf(address a) external view returns (uint256);
    function lpTransfer(address to, uint256 amount) external;
}

/**
 * @title Kortana LP Lock 🔒
 * @notice Secures LP tokens for a fixed duration to provide "Social Proof" and safety.
 * This is the ultimate signal of commitment for a brand new DEX.
 */
contract KortanaLpLock is Ownable {
    IMonoDEX public immutable dex;
    uint256 public unlockTime;

    event LiquidityLocked(uint256 amount, uint256 unlockTime);
    event LiquidityWithdrawn(uint256 amount);

    constructor(address _dex, uint256 _lockDurationSeconds) Ownable(msg.sender) {
        dex = IMonoDEX(_dex);
        unlockTime = block.timestamp + _lockDurationSeconds;
    }

    function lockInformation() external view returns (uint256 totalLocked, uint256 timeRemaining) {
        totalLocked = dex.lpBalanceOf(address(this));
        timeRemaining = block.timestamp < unlockTime ? unlockTime - block.timestamp : 0;
    }

    // After the unlock time, the owner can withdraw the liquidity back to their wallet
    function withdraw() external onlyOwner {
        require(block.timestamp >= unlockTime, "KLP: STILL_LOCKED");
        uint256 amount = dex.lpBalanceOf(address(this));
        dex.lpTransfer(owner(), amount);
        emit LiquidityWithdrawn(amount);
    }
}
