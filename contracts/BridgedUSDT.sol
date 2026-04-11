// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BridgedUSDT (kUSDT) 💵
 * @notice An ERC-20 token representing real-world USDT bridged onto the Kortana Network.
 * This contract acts as the "Mint/Burn" side of the Kortana Bridge.
 */
contract BridgedUSDT is ERC20, Ownable {
    
    // Mapping of authorized bridge controllers (e.g., automated bridge nodes or the founder)
    mapping(address => bool) public isBridgeController;

    event BridgeMint(address indexed to, uint256 amount);
    event BridgeBurn(address indexed from, uint256 amount);

    constructor() ERC20("Kortana Bridged USDT", "kUSDT") Ownable(msg.sender) {
        // The deployer is the first authorized controller by default
        isBridgeController[msg.sender] = true;
    }

    /**
     * @notice Mints kUSDT to a user once a corresponding deposit is confirmed on the source chain (BSC/ETH).
     * @param to The recipient's Kortana address.
     * @param amount The amount to mint (18 decimal units).
     */
    function bridgeMint(address to, uint256 amount) external {
        require(isBridgeController[msg.sender], "kUSDT: NOT_AUTHORIZED_CONTROLLER");
        _mint(to, amount);
        emit BridgeMint(to, amount);
    }

    /**
     * @notice Burns kUSDT when a user wants to bridge back to the source chain.
     * @param amount The amount to burn.
     */
    function bridgeBurn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit BridgeBurn(msg.sender, amount);
    }

    /**
     * @notice Adds or removes a bridge controller.
     */
    function setBridgeController(address controller, bool status) external onlyOwner {
        isBridgeController[controller] = status;
    }

    // Standard decimals for USDT parity (though ERC-20 usually uses 18, we can use 18 for high precision)
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}
