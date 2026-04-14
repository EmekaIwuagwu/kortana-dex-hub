import { useReadContract, useChainId, usePublicClient } from "wagmi";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

export function useDexRead() {
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: 9002 }); // Always read from Mainnet 9002
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

  const getAllowance = async (spender: string, owner: string) => {
    if (!publicClient) return BigInt(0);
    try {
      const data = await publicClient.readContract({
        address: dexAddress,
        abi: DEX_ABI,
        functionName: "allowance",
        args: [owner as `0x${string}`, spender as `0x${string}`],
      });
      return data as bigint;
    } catch (e) {
      console.error(e);
      return BigInt(0);
    }
  };

  return {
    rebaseIndex: rebaseInfo?.[0] ?? BigInt(0),
    lastRebaseTime: rebaseInfo?.[1] ?? BigInt(0),
    nextRebaseWindow: rebaseInfo?.[2] ?? BigInt(0),
    mintedToday: rebaseInfo?.[3] ?? BigInt(0),
    mintCap: mintCapData as bigint ?? BigInt(0),

    reserveDNR: reserves?.[0] ?? BigInt(0),
    reserveKTUSD: reserves?.[1] ?? BigInt(0),

    totalSupply: totalSupplyData as bigint ?? BigInt(0),
    getAllowance,

    refetchAll: () => {
      refetchRebase();
      refetchReserves();
      refetchTotalSupply();
      refetchMintCap();
    }
  };
}
