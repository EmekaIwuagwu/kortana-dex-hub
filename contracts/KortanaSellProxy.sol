// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * KortanaSellProxy v2
 * ====================
 * Compact sell relay for KortanaMonoDEX.
 * Uses tx.origin so DNR is returned directly to the original EOA caller,
 * avoiding any ETH-forwarding complexity inside the proxy.
 */
interface IMonoDEX {
    function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external;
}

contract KortanaSellProxy {

    address public constant DEX = 0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45;

    /**
     * @notice Step 2 of compact sell flow.
     *         DNR proceeds go directly to tx.origin (the original bot EOA).
     * @param amount18  Amount of ktUSD (18-decimal) to sell.
     */
    function sell(uint256 amount18) external {
        // DEX checks _bal[msg.sender = this proxy] — proxy must hold ktUSD first
        // DNR is sent to tx.origin (original EOA, not this proxy) avoiding re-entrancy
        IMonoDEX(DEX).swapExactKTUSDForDNR(amount18, 0, tx.origin);
    }

    receive() external payable {}
}
