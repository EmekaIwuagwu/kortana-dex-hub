"use client";

import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { useEffect } from "react";
import { kortanaMainnet } from "@/lib/wagmi";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId, status } = useAccount();
  const activeChainId = useChainId();
  const { switchChain, error: switchError, isPending } = useSwitchChain();

  useEffect(() => {
    // 🕵️‍♂️ Superman Diagnostic Heartbeat
    if (isConnected) {
      console.log("📡 [DEX DIAGNOSTIC] Network State:");
      console.log("   - Account Chain ID:", accountChainId);
      console.log("   - Active Chain ID (Wagmi):", activeChainId);
      console.log("   - Expected Chain ID:", kortanaMainnet.id);
      console.log("   - Connection Status:", status);
      
      if (accountChainId !== kortanaMainnet.id) {
        console.warn("🚨 [DEX DIAGNOSTIC] CHAIN MISMATCH DETECTED!");
        console.log("   - Forcing switchChain attempt...");
        
        // Don't spam the wallet if it's already pending
        if (!isPending) {
          switchChain({ chainId: kortanaMainnet.id });
        }
      } else {
        console.log("✅ [DEX DIAGNOSTIC] Network is aligned. 9002 confirmed.");
      }
    } else {
       // console.log("💤 [DEX DIAGNOSTIC] Wallet not connected.");
    }
  }, [isConnected, accountChainId, activeChainId, status, isPending, switchChain]);

  // Track switch errors
  useEffect(() => {
    if (switchError) {
      console.error("❌ [DEX DIAGNOSTIC] Switch Chain Error:", switchError.message);
      console.log("   - Error Details:", switchError);
    }
  }, [switchError]);

  return null;
}
