// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMonoDEX {
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/**
 * @title ktUSD Token Proxy 🪙
 * @notice Provides a "Clean" unique ERC20 address for DEX indexers (Gecko/DEXScreener).
 * It delegates all balance checks to your sovereign MonoDEX contract.
 */
contract KortanaStableToken {
    IMonoDEX public immutable dex;
    string public constant name = "Kortana Stable Dollar";
    string public constant symbol = "ktUSD";
    uint8 public constant decimals = 18;

    constructor(address _dex) {
        dex = IMonoDEX(_dex);
    }

    function totalSupply() external view returns (uint256) {
        return dex.totalSupply();
    }

    function balanceOf(address account) external view returns (uint256) {
        return dex.balanceOf(account);
    }

    // This makes the address appear as a standard ERC20 to all trackers
    // while keeping the high-efficiency logic inside your MonoDEX.
}
