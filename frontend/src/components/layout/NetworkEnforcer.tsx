"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId } = useAccount();

  useEffect(() => {
    // 🕵️‍♂️ [SENTINEL] Mainnet Resilience Strategy
    // We accept both 9002 (Official) and 7251 (Legacy) as valid Mainnet states.
    if (isConnected) {
       const isMainnet = (chainId === 9002 || chainId === 7251);
       if (isMainnet) {
         console.log("✅ [SENTINEL] Mainnet Connection Verified. ID:", chainId);
       } else {
         console.warn("⚠️ [SENTINEL] Unknown Network detected. Please switch to Mainnet.");
       }
    }
  }, [isConnected, chainId]);

  return null;
}
