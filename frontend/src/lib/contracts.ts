import { type Chain } from "viem";

export const MAINNET_CHAIN_ID = 9002;
export const LEGACY_MAINNET_ID = 7251;

export const DEX_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45" as `0x${string}`,
  [LEGACY_MAINNET_ID]: "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45" as `0x${string}`,
};

export const DEX_ABI = [
  // Hardened v2 Signatures
  "function swapExactDNRForKTUSD(uint256 minOut, address to) external payable",
  "function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external",
  "function addLiquidity(uint256 amountKTUSD, address to) external payable",
  "function balanceOf(address a) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function getAmountOut(uint256 amountIn, bool dnrIn) external view returns (uint256)",
  "function rebaseInfo() external view returns (uint256 index, uint256 lastRebaseTime, uint256 nextRebaseWindow, uint256 mintedToday, uint256 cap)",
  "function collateralOf(address a) external view returns (uint256)",
  // Events
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Sync(uint112 reserve0, uint112 reserve1)",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)"
] as const;

export const KTUSD_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
] as const;
