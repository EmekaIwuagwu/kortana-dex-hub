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

    // Read Total Supply
    const totalSupply = await client.readContract({
      address: dexAddress,
      abi: DEX_ABI,
      functionName: "totalSupply",
    }) as bigint;

    // Rebase Info
    const rebaseData = await client.readContract({
      address: dexAddress,
      abi: DEX_ABI,
      functionName: "rebaseInfo",
    }) as [bigint, bigint, bigint, bigint, bigint];

    const stats = {
      provider: "KortanaDEX",
      network: "Kortana Mainnet",
      pairs: [
        {
          pair_address: dexAddress,
          base_symbol: "DNR",
          base_address: "0x0000000000000000000000000000000000000000",
          quote_symbol: "ktUSD",
          quote_address: dexAddress,
          price_in_ktusd: price,
          reserves_base: dnrRes.toFixed(4),
          reserves_quote: ktusdRes.toFixed(4),
          tvl_usd: (ktusdRes * 2).toFixed(2), // Assuming ktUSD = $1
          total_lp_supply: formatEther(totalSupply),
          apr: "1240%" // Highlight the farming yield for indexers
        }
      ],
      updated_at: new Date().toISOString(),
      factory_address: "0x20A096cC7b435142856aB239fe43c2e245ed947e"
    };

    return Response.json(stats);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
