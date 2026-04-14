import { useAccount, useSwitchChain } from "wagmi";
import { useEffect } from "react";
import { kortanaMainnet } from "@/lib/wagmi";

export function NetworkEnforcer() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // Only enforce in production of on the wrong network
    if (isConnected && chainId !== kortanaMainnet.id) {
       console.log("🛠️ Superman Network Guard: Forcing switch to Kortana Mainnet...");
       switchChain({ chainId: kortanaMainnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  return null;
}
