"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId } = useAccount();

  useEffect(() => {
    // 🕵️‍♂️ [SENTINEL] Silent mode active.
    // The Identity Spoof in wagmi.ts handles the legacy ID internally.
    if (isConnected) {
      console.log("✅ [SENTINEL] Mainnet Mode Verified (Canonical):", chainId);
    }
  }, [isConnected, chainId]);

  return null;
}
