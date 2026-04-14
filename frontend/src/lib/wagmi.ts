import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { 
  metaMaskWallet, 
  rainbowWallet, 
  walletConnectWallet, 
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
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

// ─── Custom Kortana Wallet Connector ──────────────────────────────────────────
// This is the "Superman" fix. It explicitly targets the Kortana Wallet provider
// even if it's not using window.ethereum, resolving the "Wrong Network" bug.

const kortanaWallet = ({ projectId, chains }: any) => ({
  id: 'kortana',
  name: 'Kortana Wallet',
  iconUrl: '/logo.png', // Your logo
  iconBackground: '#fff',
  downloadUrls: { chrome: 'https://kortana.xyz' },
  // This creates the dedicated "Kortana Wallet" handshake logic
  createConnector: (walletDetails: any) => injected({
    target: () => ({
      id: 'kortana',
      name: 'Kortana Wallet',
      // Check window.kortana then fallback to window.ethereum
      // SSR Guard: only check in the browser
      provider: typeof window !== 'undefined' ? ((window as any).kortana || (window as any).ethereum) : undefined,
    }),
  }),
});

// ─── Wagmi & RainbowKit Config ────────────────────────────────────────────────
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "3fcc6b5675e297800e84b72643a37554";

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Kortana Eco',
      wallets: [
        // Dedicated button now appears for the wallet with zero conflict
        kortanaWallet,
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
  multiInjectedProviderDiscovery: true, 
  transports: {
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz", {
      batch: { multicall: true },
      timeout: 30000,
    }),
    [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz"),
  },
});
