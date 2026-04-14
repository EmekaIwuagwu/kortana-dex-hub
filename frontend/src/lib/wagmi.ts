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

// ─── STRICT MAINNET DEFINITION ────────────────────────────────────────────────
// PURGE COMPLETE: 7251 has been removed from all configurations.
// The app now ONLY recognizes 9002 as the Kortana Mainnet.

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

export const chains = [kortanaMainnet] as const;

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

const projectId = "3fcc6b5675e297800e84b72643a37554"; 

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
    [9002]: http("https://zeus-rpc.mainnet.kortana.xyz", { timeout: 60000 }),
  },
});
