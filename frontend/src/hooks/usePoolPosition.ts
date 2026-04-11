import { useReadContract, useChainId } from "wagmi";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

export function usePoolPosition(userKlpBalance: bigint) {
  const chainId = useChainId();
  const dexAddress = DEX_ADDRESS[chainId as keyof typeof DEX_ADDRESS] as `0x${string}`;

  const { data: lpTotalSupplyData } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "lpTotalSupply",
    chainId,
  });

  const { data: reservesData } = useReadContract({
    address: dexAddress,
    abi: DEX_ABI,
    functionName: "getReserves",
    chainId,
  });

  const lpTotalSupply = (lpTotalSupplyData as bigint) ?? BigInt(0);
  const reserve0 = reservesData ? (reservesData as any)[0] as bigint : BigInt(0);
  const reserve1 = reservesData ? (reservesData as any)[1] as bigint : BigInt(0);

  let userSharePct = 0;
  let userDNR = BigInt(0);
  let userKTUSD = BigInt(0);

  if (lpTotalSupply > BigInt(0) && userKlpBalance > BigInt(0)) {
    userSharePct = Number(userKlpBalance * BigInt(10000) / lpTotalSupply) / 100;
    userDNR = (reserve0 * userKlpBalance) / lpTotalSupply;
    userKTUSD = (reserve1 * userKlpBalance) / lpTotalSupply;
  }

  return {
    userDNR,
    userKTUSD,
    userSharePct,
    reserveDNR: reserve0,
    reserveKTUSD: reserve1,
    lpTotalSupply
  };
}
