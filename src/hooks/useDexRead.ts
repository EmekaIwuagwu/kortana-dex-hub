import { useReadContract, useChainId } from "wagmi";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

export function useDexRead() {
  const chainId = useChainId();
  const dexAddress = DEX_ADDRESS[chainId as keyof typeof DEX_ADDRESS] as `0x${string}`;

  const { data: rebaseInfoData, refetch: refetchRebase } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "rebaseInfo",
    chainId,
  });

  const { data: getReservesData, refetch: refetchReserves } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "getReserves",
    chainId,
  });

  const { data: totalSupplyData, refetch: refetchTotalSupply } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "totalSupply",
    chainId,
  });

  const { data: mintCapData, refetch: refetchMintCap } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "mintCap",
    chainId,
  });

  const rebaseInfo = rebaseInfoData as [bigint, bigint, bigint, bigint, bigint] | undefined;
  const reserves = getReservesData as [bigint, bigint, number] | undefined;

  return {
    rebaseIndex: rebaseInfo?.[0] ?? BigInt(0),
    lastRebaseTime: rebaseInfo?.[1] ?? BigInt(0),
    nextRebaseWindow: rebaseInfo?.[2] ?? BigInt(0),
    mintedToday: rebaseInfo?.[3] ?? BigInt(0),
    mintCap: mintCapData as bigint ?? BigInt(0),

    reserveDNR: reserves?.[0] ?? BigInt(0),
    reserveKTUSD: reserves?.[1] ?? BigInt(0),

    totalSupply: totalSupplyData as bigint ?? BigInt(0),

    refetchAll: () => {
      refetchRebase();
      refetchReserves();
      refetchTotalSupply();
      refetchMintCap();
    }
  };
}
