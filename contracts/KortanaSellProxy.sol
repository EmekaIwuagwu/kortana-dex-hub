// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * KortanaDNRWithdrawWrapper
 * ==========================
 * Option B: Minimal wrapper that intercepts the DEX's _sendDNR call,
 * receives DNR into this contract, then forwards it to the original caller
 * using payable.transfer() — avoiding the chain's .call{value} gas issue.
 *
 * Flow (bot executes 2 compact txs, each well under Kortana RLP limit):
 *   Tx 1: dex.approve(wrapper, amount)          → 64 bytes calldata ✅
 *   Tx 2: wrapper.sell(amount)                  → 36 bytes calldata ✅
 *
 * Inside wrapper.sell():
 *   a) Pull ktUSD from bot via transferFrom
 *   b) Call dex.swapExactKTUSDForDNR(amount, 0, address(this))
 *      → DEX sends DNR to THIS contract via _sendDNR (contract receive())
 *   c) Forward all received DNR to tx.origin (original bot EOA) via transfer()
 */

interface IMonoDEX {
    function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract KortanaDNRWithdrawWrapper {

    address public constant DEX = 0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45;

    /**
     * @notice  Sell ktUSD → receive DNR.
     *          Requires bot to have called dex.approve(address(this), amount) first.
     * @param   amount18  Amount of ktUSD in 18-decimal to sell.
     */
    function sell(uint256 amount18) external {
        // Step 1: Pull ktUSD from caller into this wrapper
        IMonoDEX(DEX).transferFrom(msg.sender, address(this), amount18);

        // Step 2: Swap ktUSD → DNR, receiving DNR into this contract
        // DEX's _sendDNR will call this.receive() which is cheap
        IMonoDEX(DEX).swapExactKTUSDForDNR(amount18, 0, address(this));

        // Step 3: Forward all DNR to original caller using transfer() — not call{}
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(msg.sender).transfer(balance);
        }
    }

    /// @notice Accept DNR from the DEX's _sendDNR call
    receive() external payable {}
}
