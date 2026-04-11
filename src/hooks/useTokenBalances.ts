import { useAccount, useBalance, useReadContract, useChainId } from "wagmi";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

export function useTokenBalances(chainIdArg?: number) {
  const currentChainId = useChainId();
  const chainId = chainIdArg || currentChainId;
  const { address } = useAccount();

  const { data: dnrBalanceData, isLoading: loadingDnr, refetch: refetchDnr } = useBalance({
    address,
    chainId,
  });

  const { data: ktUSDBalance, isLoading: loadingKtUSD, refetch: refetchKtUSD } = useReadContract({
    address: DEX_ADDRESS[chainId] as `0x${string}`,
    abi: DEX_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
  });

  const { data: klpBalance, isLoading: loadingKlp, refetch: refetchKlp } = useReadContract({
    address: DEX_ADDRESS[chainId] as `0x${string}`,
    abi: DEX_ABI,
    functionName: "lpBalanceOf",
    args: address ? [address] : undefined,
    chainId,
  });

  return {
    dnrBalance: dnrBalanceData?.value ?? BigInt(0),
    ktUSDBalance: (ktUSDBalance as bigint) ?? BigInt(0),
    klpBalance: (klpBalance as bigint) ?? BigInt(0),
    loading: loadingDnr || loadingKtUSD || loadingKlp,
    refetchAll: () => {
      refetchDnr();
      refetchKtUSD();
      refetchKlp();
    }
  };
}
