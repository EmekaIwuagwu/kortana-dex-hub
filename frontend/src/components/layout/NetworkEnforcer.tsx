"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId } = useAccount();

  useEffect(() => {
    if (isConnected) {
      // 🕵️‍♂️ Identity check for both Legacy and modern IDs
      const isValid = accountChainId === 9002 || accountChainId === 7251;
      
      if (!isValid) {
        console.warn("🚨 [SENTINEL] Unknown Network detected:", accountChainId);
      } else {
        console.log("✅ [SENTINEL] Network Validated (Mainnet Mode):", accountChainId);
      }
    }
  }, [isConnected, accountChainId]);

  return null;
}
