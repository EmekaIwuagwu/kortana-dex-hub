import { useState, useEffect } from "react";
import { usePublicClient, useChainId } from "wagmi";
import { formatEther, parseEther } from "viem";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

export function usePriceQuote(sellAmount: string, isDNRtoKTUSD: boolean) {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId });
  const [buyAmount, setBuyAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    if (!sellAmount || isNaN(Number(sellAmount)) || Number(sellAmount) <= 0 || !publicClient) {
      setBuyAmount("");
      setLoading(false);
      return;
    }

    const fetchQuote = async () => {
      setLoading(true);
      try {
        const result = await publicClient.readContract({
          address: DEX_ADDRESS[chainId as keyof typeof DEX_ADDRESS] as `0x${string}`,
          abi: DEX_ABI,
          functionName: "getAmountOut",
          args: [parseEther(sellAmount), isDNRtoKTUSD],
        });
        if (!cancelled) setBuyAmount(formatEther(result as bigint));
      } catch (err) {
        console.error("Quote error", err);
        if (!cancelled) setBuyAmount("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [sellAmount, isDNRtoKTUSD, publicClient, chainId]);

  return { buyAmount, loading };
}
