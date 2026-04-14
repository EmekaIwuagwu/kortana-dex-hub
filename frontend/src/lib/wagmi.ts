import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { 
  metaMaskWallet, 
  rainbowWallet, 
  walletConnectWallet, 
  coinbaseWallet,
  injectedWallet 
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { type Chain } from "viem";

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
} as const satisfies Chain;

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
} as const satisfies Chain;

// ─── Environment detection ───────────────────────────────────────────────────
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
const chains = isProduction ? [kortanaMainnet] as const : [kortanaMainnet, kortanaTestnet] as const;

// ─── Wagmi & RainbowKit Config ────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "3fcc6b5675e297800e84b72643a37554";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Kortana Wallet',
      wallets: [
        // Forces discovery of the Kortana Wallet even if window.ethereum is blocked
        injectedWallet,
        metaMaskWallet,
      ],
    },
    {
      groupName: 'Popular',
      wallets: [
        rainbowWallet,
        coinbaseWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: 'KortanaDEX',
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains,
  ssr: true,
  // This allows multiple wallets to coexist without being "swallowed" by MetaMask
  multiInjectedProviderDiscovery: true, 
  transports: {
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz", {
      // DISABLED MULTICALL: This is the Superman fix for "Wrong Network" ghosts 
      // on chains where multicall3 isn't globally indexed yet.
      // Removed batching for absolute compliance.
      timeout: 60000, 
    }),
    [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz"),
  },
});
