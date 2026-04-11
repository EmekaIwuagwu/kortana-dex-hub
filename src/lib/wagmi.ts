import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

const kortanaMainnet = {
  id: 9002,
  name: "Kortana Mainnet",
  nativeCurrency: { name: "DNR", symbol: "DNR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://zeus-rpc.mainnet.kortana.xyz"] },
  },
  blockExplorers: {
    default: { name: "Kortana Explorer", url: "https://explorer.mainnet.kortana.xyz" },
  },
} as const;

const kortanaTestnet = {
  id: 72511,
  name: "Kortana Testnet",
  nativeCurrency: { name: "DNR", symbol: "DNR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://poseidon-rpc.testnet.kortana.xyz/"] },
  },
  blockExplorers: {
    default: { name: "Kortana Explorer", url: "https://explorer.testnet.kortana.xyz" },
  },
} as const;

export const config = getDefaultConfig({
  appName: "KortanaDEX",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "demo_project_id",
  chains: [kortanaMainnet, kortanaTestnet],
  transports: {
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz"),
    [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz/"),
  },
});
