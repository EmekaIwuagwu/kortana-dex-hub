"use client";

import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { useEffect } from "react";
import { kortanaMainnet } from "@/lib/wagmi";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId } = useAccount();
  const activeChainId = useChainId();
  const { switchChain, error: switchError, isPending } = useSwitchChain();

  useEffect(() => {
    if (isConnected) {
      // 🕵️‍♂️ DIAGNOSTIC CHECK
      const isCorrectNetwork = (accountChainId === 9002 || accountChainId === 7251);
      
      if (!isCorrectNetwork) {
        console.warn("🚨 [DEX DIAGNOSTIC] UNKNOWN NETWORK:", accountChainId);
        if (!isPending) {
           // We only attempt switch if the wallet supports it
           switchChain({ chainId: kortanaMainnet.id });
        }
      } else {
        console.log("✅ [DEX DIAGNOSTIC] Network Validated:", accountChainId);
      }
    }
  }, [isConnected, accountChainId, activeChainId, isPending, switchChain]);

  // Gracefully handle the "Method not found" case
  useEffect(() => {
    if (switchError) {
      if (switchError.message.includes("wallet_switchEthereumChain not found")) {
         console.warn("🛡️ Superman Guard: Wallet does not support auto-switching. User must switch manually in extension.");
      } else {
         console.error("❌ Switch Error:", switchError.message);
      }
    }
  }, [switchError]);

  return null;
}
