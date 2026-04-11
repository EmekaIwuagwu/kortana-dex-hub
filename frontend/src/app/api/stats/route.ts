import { createPublicClient, http, formatEther } from "viem";
import { DEX_ADDRESS, DEX_ABI } from "@/lib/contracts";

const MAINNET_RPC = "https://zeus-rpc.mainnet.kortana.xyz";
const MAINNET_CHAIN_ID = 9002;

export async function GET() {
  try {
    const client = createPublicClient({
      chain: {
        id: MAINNET_CHAIN_ID,
        name: "Kortana Mainnet",
        nativeCurrency: { name: "DNR", symbol: "DNR", decimals: 18 },
        rpcUrls: { default: { http: [MAINNET_RPC] } }
      } as any,
      transport: http(MAINNET_RPC),
    });

    const dexAddress = DEX_ADDRESS[MAINNET_CHAIN_ID];

    // Read Reserves
    const reserves = await client.readContract({
      address: dexAddress,
      abi: DEX_ABI,
      functionName: "getReserves",
    }) as [bigint, bigint, number];

    const dnrRes = Number(formatEther(reserves[0]));
    const ktusdRes = Number(formatEther(reserves[1]));
    
    // Spot Price: DNR per 1 ktUSD
    const price = dnrRes > 0 ? (ktusdRes / dnrRes).toFixed(6) : "1.000000";

    // Rebase Info
    const rebaseData = await client.readContract({
      address: dexAddress,
      abi: DEX_ABI,
      functionName: "rebaseInfo",
    }) as [bigint, bigint, bigint, bigint, bigint];

    const stats = {
      price_dnr_ktusd: price,
      tvl_dnr: dnrRes * 2, // DNR + ktUSD (effectively doubled in DNR value if at peg)
      ktusd_supply: formatEther(rebaseData[3]),
      rebase_index: (Number(rebaseData[0]) / 1e9).toFixed(6),
      updated_at: new Date().toISOString(),
      network: "Kortana Mainnet",
      dex_address: dexAddress,
    };

    return Response.json(stats);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
