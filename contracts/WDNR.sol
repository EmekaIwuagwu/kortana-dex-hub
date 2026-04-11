// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WDNR — Wrapped DNR
 * @notice Exists solely as an ERC-20 identity for DEX Screener pair identification.
 *         DNR is native. This contract is NOT used in actual swaps.
 *         Deploy first. Pass address to KortanaMonoDEX constructor.
 */
contract WDNR {
    string public constant name     = "Wrapped DNR";
    string public constant symbol   = "WDNR";
    uint8  public constant decimals = 18;
}
