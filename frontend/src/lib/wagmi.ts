import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createConfig } from "wagmi";

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

// ─── WalletConnect Project ID ─────────────────────────────────────────────────
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "3fcc6b5675e297800e84b72643a37554";

// ─── Wallet groups ────────────────────────────────────────────────────────────
// injectedWallet catches ANY browser-injected provider including Kortana Wallet extension.
// It will show "Browser Wallet" / "Kortana Wallet" at the top of the list.
const walletGroups = [
  {
    groupName: "Kortana Wallet",
    wallets: [injectedWallet],
  },
  {
    groupName: "Other Wallets",
    wallets: [metaMaskWallet, rainbowWallet, trustWallet, coinbaseWallet, walletConnectWallet],
  },
];

const connectors = connectorsForWallets(walletGroups, {
  appName: "KortanaDEX",
  projectId,
});

// ─── Environment detection ────────────────────────────────────────────────────
// On dex.kortana.xyz OR NEXT_PUBLIC_APP_ENV=production → mainnet ONLY (no testnet shown)
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

// ─── Build chains tuple based on environment ──────────────────────────────────
// TypeScript needs a proper tuple type, so we branch explicitly.
const chains = (
  isProduction
    ? [kortanaMainnet]
    : [kortanaMainnet, kortanaTestnet]
) as typeof isProduction extends true
  ? readonly [typeof kortanaMainnet]
  : readonly [typeof kortanaMainnet, typeof kortanaTestnet];

// ─── Transports ───────────────────────────────────────────────────────────────
const transports: Record<number, ReturnType<typeof http>> = {
  [kortanaMainnet.id]: http("https://zeus-rpc.mainnet.kortana.xyz"),
  ...(!isProduction && { [kortanaTestnet.id]: http("https://poseidon-rpc.testnet.kortana.xyz") }),
};

// ─── Wagmi config ─────────────────────────────────────────────────────────────
export const config = createConfig({
  chains: chains as unknown as [typeof kortanaMainnet, ...typeof kortanaTestnet[]],
  connectors,
  transports,
  ssr: true,
});
