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
const chains = (isProduction ? [kortanaMainnet] : [kortanaMainnet, kortanaTestnet]) as any;

// ─── Wagmi & RainbowKit Config ────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "3fcc6b5675e297800e84b72643a37554";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Kortana Wallet',
      wallets: [
        // Forces a dedicated "Kortana Wallet" button that is NOT just a generic Injected item.
        // This solves the "Doesn't pop up" issue by providing an explicit target.
        injectedWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        metaMaskWallet,
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
  // This is CRITICAL. Multi-injected discovery (EIP-6963) allows MetaMask 
  // and Kortana Wallet to coexist without the "Wrong Network" conflict.
  multiInjectedProviderDiscovery: true, 
  transports: {
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz", {
      batch: { multicall: true },
      retryCount: 3,
    }),
    [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz"),
  },
});
