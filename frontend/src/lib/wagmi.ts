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

// ─── Mainnet Definition ───────────────────────────────────────────────────────
// THIS IS THE ONLY CHAIN ALLOWED ON dex.kortana.xyz
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

// ─── Production Locking ──────────────────────────────────────────────────────
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

// Forcing STRICT mainnet-only in production. 
// We are removing all testnet chains from the list to prevent the "Logged into Testnet" bug.
export const chains = isProduction ? [kortanaMainnet] as const : [kortanaMainnet] as const;

// ─── Custom Kortana Wallet Connector ──────────────────────────────────────────
const kortanaWallet = ({ projectId, chains }: any) => ({
  id: 'kortana',
  name: 'Kortana Wallet',
  iconUrl: '/logo.png',
  iconBackground: '#fff',
  downloadUrls: { chrome: 'https://kortana.xyz' },
  createConnector: (walletDetails: any) => injected({
    target: () => ({
      id: 'kortana',
      name: 'Kortana Wallet',
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
    [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz", { timeout: 60000 }),
  },
});
