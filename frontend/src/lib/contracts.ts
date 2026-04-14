export const MAINNET_CHAIN_ID = 9002;
export const TESTNET_CHAIN_ID = 72511;

// ─── STRICT 9002 MAINNET MAPPING ──────────────────────────────────────────────
// ALL LEGACY 7251 REFERENCES PURGED.

export const DEX_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0xD7a385546a6a2355C6a1DfAdf33b55c43e2C19B0" as `0x${string}`,
};

export const WDNR_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0xF08ef4987108dD4AEE330Da1255CD0D7CaBEd0a3" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0xB6B18cae509Fcf3542FF6975C2Da06CAAc9773c5" as `0x${string}`,
};

export const KLP_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x8EbbEa445af4Cae8a2FA16b184EeB792d424CD45" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0xD7a385546a6a2355C6a1DfAdf33b55c43e2C19B0" as `0x${string}`,
};

export const FACTORY_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x20A096cC7b435142856aB239fe43c2e245ed947e" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0x4060eF0D5a7F0633c5927F7E05041dd7Fcd95f42" as `0x${string}`,
};

export const ROUTER_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x114042E3E010B49F2d149B1Ebcb3870e602DC749" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0x15E1268353F6F19D9de2722bD60eC1081b45D3a6" as `0x${string}`,
};

export const FARM_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0xe876DC33456E27eEB1FB5Fb967ce3DfB1C88180E" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0x9cD5998cd48385cb69AE7AaDdFaC83A5DA185FaA" as `0x${string}`,
};

export const KUSDT_ADDRESS: Record<number, `0x${string}`> = {
  [MAINNET_CHAIN_ID]: "0x6017846b164d606ae24B54732C8aC71b81bA1FdF" as `0x${string}`,
  [TESTNET_CHAIN_ID]: "0x43dFD957bB91b568176E976A8d4e8ab4E94aeBfD" as `0x${string}`,
};

export const DEX_ABI = [
  // ktUSD ERC-20
  { name: "name",        type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "symbol",      type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "balanceOf",   type: "function", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "transfer",    type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "transferFrom",type: "function", stateMutability: "nonpayable", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "approve",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "allowance",   type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "mint",        type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "mintWithCollateral", type: "function", stateMutability: "payable", inputs: [{ name: "ktUSDAmount18", type: "uint256" }, { name: "to", type: "address" }], outputs: [] },
  { name: "isOperator",  type: "function", stateMutability: "view", inputs: [{ name: "addr", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "setOperator", type: "function", stateMutability: "nonpayable", inputs: [{ name: "addr", type: "address" }, { name: "enabled", type: "bool" }], outputs: [] },
  { name: "lpBalanceOf",   type: "function", stateMutability: "view",        inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lpTotalSupply", type: "function", stateMutability: "view",        inputs: [], outputs: [{ type: "uint256" }] },
  { name: "lpTransfer",    type: "function", stateMutability: "nonpayable",  inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "lpApprove",     type: "function", stateMutability: "nonpayable",  inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "lpAllowance",   type: "function", stateMutability: "view",        inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lpTransferFrom",type: "function", stateMutability: "nonpayable",  inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "poolLength",    type: "function", stateMutability: "view",        inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getReserves",    type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "reserve0", type: "uint112" }, { name: "reserve1", type: "uint112" }, { name: "blockTimestampLast", type: "uint32" }] },
  { name: "getAmountOut",   type: "function", stateMutability: "view", inputs: [{ name: "amountIn18", type: "uint256" }, { name: "dnrIn", type: "bool" }], outputs: [{ type: "uint256" }] },
  { name: "getAmountsOut",  type: "function", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }, { name: "path", type: "address[]" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
  { name: "addLiquidity",   type: "function", stateMutability: "payable", inputs: [{ name: "amountKTUSD18", type: "uint256" }, { name: "minKTUSD18", type: "uint256" }, { name: "minDNR18", type: "uint256" }, { name: "to", type: "address" }], outputs: [] },
  { name: "removeLiquidity",type: "function", stateMutability: "nonpayable", inputs: [{ name: "lpAmount18", type: "uint256" }, { name: "minKTUSD18", type: "uint256" }, { name: "minDNR18", type: "uint256" }, { name: "to", type: "address" }], outputs: [] },
  { name: "swapExactDNRForKTUSD",  type: "function", stateMutability: "payable", inputs: [{ name: "minOut18", type: "uint256" }, { name: "to", type: "address" }], outputs: [] },
  { name: "swapExactKTUSDForDNR",  type: "function", stateMutability: "nonpayable", inputs: [{ name: "amountIn18", type: "uint256" }, { name: "minOut18", type: "uint256" }, { name: "to", type: "address" }], outputs: [] },
] as const;

export const FACTORY_ABI = [
  { name: "getPair", type: "function", stateMutability: "view", inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }], outputs: [{ type: "address" }] },
  { name: "allPairs", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "address" }] },
  { name: "allPairsLength", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export const ROUTER_ABI = [
  { name: "factory", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "WDNR", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "addLiquidity", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }, { name: "amountADesired", type: "uint256" }, { name: "amountBDesired", type: "uint256" }, { name: "amountAMin", type: "uint256" }, { name: "amountBMin", type: "uint256" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ name: "amountA", type: "uint256" }, { name: "amountB", type: "uint256" }, { name: "liquidity", type: "uint256" }] },
  { name: "swapExactTokensForTokens", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
] as const;

export const FARM_ABI = [
  { name: "dnrPerSecond", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "poolInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTime", type: "uint256" }, { name: "accDnrPerShare", type: "uint256" }] },
  { name: "userInfo", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }] },
  { name: "pendingDNR", type: "function", stateMutability: "view", inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "deposit", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_pid", type: "uint256" }, { name: "_amount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_pid", type: "uint256" }, { name: "_amount", type: "uint256" }], outputs: [] },
] as const;
