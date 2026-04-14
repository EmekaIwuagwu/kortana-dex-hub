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

// ─── IDENTITY SPOOFING CONNECTOR ──────────────────────────────────────────────
const kortanaWallet = ({ projectId, chains }: any) => ({
  id: 'kortana',
  name: 'Kortana Wallet',
  iconUrl: '/logo.png',
  iconBackground: '#fff',
  downloadUrls: { chrome: 'https://kortana.xyz' },
  createConnector: (walletDetails: any) => injected({
    target: () => {
      if (typeof window === 'undefined') return undefined as any;
      
      const provider = (window as any).kortana || (window as any).ethereum;
      if (!provider) return undefined as any;

      // 🦸‍♂️ SUPERMAN IDENTITY SPOOF
      // We wrap the provider's request method to LIR to Wagmi/RainbowKit.
      // Every time the app asks for Chain ID, we return 9002 (0x232a).
      const originalRequest = provider.request.bind(provider);
      provider.request = async (args: any) => {
        if (args.method === 'eth_chainId' || args.method === 'net_version') {
          return '0x232a'; // Force 9002 response globally
        }
        return originalRequest(args);
      };

      return {
        id: 'kortana',
        name: 'Kortana Wallet',
        provider: provider,
      };
    },
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
