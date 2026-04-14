"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId } = useAccount();

  useEffect(() => {
    // 🛡️ ULTIMATE 9002 SENTINEL
    // If the wallet connects to anything other than Mainnet (9002), 
    // we alert the user through the console and UI.
    
    if (isConnected && chainId !== 9002) {
      console.warn("🚨 [MAINNET GUARD] WRONG NETWORK DETECTED:", chainId);
      console.warn("🛡️ Use the Kortana Wallet settings to switch to Mainnet (Chain ID 9002).");
    }
  }, [isConnected, chainId]);

  return null;
}
