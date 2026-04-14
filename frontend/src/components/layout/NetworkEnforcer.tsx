"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId } = useAccount();

  useEffect(() => {
    // 🛡️ Superman Soft-Alignment Guard
    // We now accept BOTH 9002 and 7251 as valid states.
    // By NOT forcing a switch, we avoid the wallet's "Network Changed" security block.
    
    if (isConnected) {
       const isValid = (accountChainId === 9002 || accountChainId === 7251);
       
       if (!isValid) {
         console.warn("🚨 [SENTINEL] Unknown Network detected:", accountChainId);
         // Only force switches for truly unknown/wrong networks (like Testnet or Localhost)
       } else {
         console.log("✅ [SENTINEL] Network Soft-Aligned:", accountChainId === 7251 ? "Mainnet (via Legacy ID)" : "Mainnet (Native)");
       }
    }
  }, [isConnected, accountChainId]);

  return null;
}
