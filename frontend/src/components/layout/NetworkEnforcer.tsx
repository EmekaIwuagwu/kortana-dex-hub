"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";
import { kortanaMainnet } from "@/lib/wagmi";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId } = useAccount();

  useEffect(() => {
    // 🕵️‍♂️ Superman Network Guard
    const updateNetwork = async () => {
      if (isConnected && accountChainId !== 9002) {
        console.log("🚀 [DEX DIAGNOSTIC] Detected Legacy/Testnet ID:", accountChainId);
        console.log("🛡️ Superman Guard: Forcing Direct AddChain request for Mainnet...");

        if (typeof window !== 'undefined' && (window as any).ethereum) {
           try {
              // This is the "Force-Add" maneuver. 
              // Most custom wallets support ADD even if they fail at SWITCH.
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x232a', // 9002 in Hex
                  chainName: 'Kortana Mainnet',
                  nativeCurrency: { name: 'DNR', symbol: 'DNR', decimals: 18 },
                  rpcUrls: ['https://zeus-rpc.mainnet.kortana.xyz'],
                  blockExplorerUrls: ['https://explorer.mainnet.kortana.xyz'],
                }],
              });
              console.log("✅ [DEX DIAGNOSTIC] AddChain request successful.");
           } catch (e: any) {
              console.error("❌ [DEX DIAGNOSTIC] Force-Add Failed:", e.message);
           }
        }
      }
    };

    updateNetwork();
  }, [isConnected, accountChainId]);

  return null;
}
