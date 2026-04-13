// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ⚔️ Kortana Traction Proxy (v2)
 * =============================
 * Compact sell relay to bypass the 180-byte RLP limit.
 * 
 * Flow:
 * 1. Bot approves this Proxy once.
 * 2. Bot calls proxy.s(amount).
 * 3. Proxy pulls ktUSD, calls DEX, DNR goes to Bot.
 */

interface IDEX {
    function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external;
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract TractionProxy {
    address public constant DEX = 0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45;

    /**
     * @notice Short function name "s" to keep calldata extra small.
     * @param a Amount of ktUSD to sell.
     */
    function s(uint256 a) external {
        // 1. Pull ktUSD from bot
        IDEX(DEX).transferFrom(msg.sender, address(this), a);
        
        // 2. DEX swap (to EOA bot)
        // Note: DEX checks _bal[address(this)] now. 
        // DEX sends DNR directly to msg.sender (the Bot EOA).
        IDEX(DEX).swapExactKTUSDForDNR(a, 0, msg.sender);
    }
    
    // Accept DNR if needed
    receive() external payable {}
}
