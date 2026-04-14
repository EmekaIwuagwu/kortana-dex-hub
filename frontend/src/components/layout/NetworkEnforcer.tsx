"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId, address } = useAccount();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    console.log("🛰️ [SENTINEL] NetworkEnforcer Mounted.");
    console.log("   - isConnected:", isConnected);
    console.log("   - Wallet Address:", address);
    console.log("   - accountChainId:", accountChainId);
  }, [isConnected, address, accountChainId]);

  useEffect(() => {
    const enforceMainnet = async () => {
      if (isConnected && accountChainId !== 9002 && !isSwitching) {
        setIsSwitching(true);
        console.warn("🛡️ [SENTINEL] TRIGGER: Wrong Network detected.");
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
           try {
              console.log("⚡ [SENTINEL] Attempting Force-Add (wallet_addEthereumChain)...");
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x232a', // 9002
                  chainName: 'Kortana Mainnet',
                  nativeCurrency: { name: 'DNR', symbol: 'DNR', decimals: 18 },
                  rpcUrls: ['https://zeus-rpc.mainnet.kortana.xyz'],
                  blockExplorerUrls: ['https://explorer.mainnet.kortana.xyz'],
                }],
              });
              console.log("✅ [SENTINEL] Force-Add success. User should be on 9002.");
           } catch (e: any) {
              console.error("❌ [SENTINEL] Force-Add Failed:", e.message);
           } finally {
              setTimeout(() => setIsSwitching(false), 8000);
           }
        } else {
            console.error("❌ [SENTINEL] window.ethereum not found!");
        }
      }
    };

    enforceMainnet();
  }, [isConnected, accountChainId, isSwitching]);

  return null;
}
