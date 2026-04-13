// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDEX {
    function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external;
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract TractionProxyV3 {
    address public constant DEX = 0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45;

    /**
     * @notice Compact sell relay that keeps DNR in the Proxy to ensure SUCCESS.
     * @param a Amount of ktUSD to sell.
     */
    function s(uint256 a) external {
        // 1. Pull ktUSD from bot
        IDEX(DEX).transferFrom(msg.sender, address(this), a);
        
        // 2. DEX swap (Resulting DNR stays IN THE PROXY)
        // This solves the EOA-transfer-failed bug
        IDEX(DEX).swapExactKTUSDForDNR(a, 0, address(this));
    }
    
    // Accept DNR
    receive() external payable {}

    // Owner can withdraw collected DNR later
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}
