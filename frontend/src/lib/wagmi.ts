import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

// ─── Chain definitions ────────────────────────────────────────────────────────

export const kortanaMainnet = {
  id: 9002,
  name: "Kortana Mainnet",
  nativeCurrency: { name: "DNR", symbol: "DNR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://zeus-rpc.mainnet.kortana.xyz"] },
    public: { http: ["https://zeus-rpc.mainnet.kortana.xyz"] },
  },
  blockExplorers: {
    default: { name: "Kortana Explorer", url: "https://explorer.mainnet.kortana.xyz" },
  },
} as const;

export const kortanaTestnet = {
  id: 72511,
  name: "Kortana Testnet",
  nativeCurrency: { name: "DNR", symbol: "DNR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://poseidon-rpc.testnet.kortana.xyz"] },
    public: { http: ["https://poseidon-rpc.testnet.kortana.xyz"] },
  },
  blockExplorers: {
    default: { name: "Kortana Explorer", url: "https://explorer.testnet.kortana.xyz" },
  },
} as const;

// ─── Environment detection ────────────────────────────────────────────────────
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

// Only mainnet in production to avoid showing testnet to users
const chains = (
  isProduction ? [kortanaMainnet] : [kortanaMainnet, kortanaTestnet]
) as unknown as readonly [typeof kortanaMainnet, ...typeof kortanaTestnet[]];

// ─── Wagmi config ─────────────────────────────────────────────────────────────
// Using getDefaultConfig for robust MetaMask and standard wallet support.
// Removes the custom "Kortana Wallet" grouping requested by the user.
export const config = getDefaultConfig({
  appName: "KortanaDEX",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "3fcc6b5675e297800e84b72643a37554",
  chains: chains,
  ssr: true,
  transports: {
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz"),
    ...(!isProduction && { [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz") }),
  },
});
