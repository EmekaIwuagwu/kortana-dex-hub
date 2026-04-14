"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

export function NetworkEnforcer() {
  const { isConnected, chainId: accountChainId } = useAccount();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const enforceMainnet = async () => {
      // 🛡️ ZERO TOLERANCE: Any ID that isn't 9002 is considered "The Wrong Network"
      if (isConnected && accountChainId !== 9002 && !isSwitching) {
        setIsSwitching(true);
        console.warn("🛡️ Superman Zero-Tolerance Guard: Forcing switch to Mainnet (9002)...");
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
           try {
              // We use Direct AddChain to force the wallet to recognize the Mainnet params
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
              console.log("✅ Mainnet Switch Request sent.");
           } catch (e: any) {
              console.error("❌ Force Switch Failed:", e.message);
           } finally {
              // Wait 5 seconds before allowing another attempt to prevent spamming popups
              setTimeout(() => setIsSwitching(false), 5000);
           }
        }
      }
    };

    enforceMainnet();
  }, [isConnected, accountChainId, isSwitching]);

  return null;
}
