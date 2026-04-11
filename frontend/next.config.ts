import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["recharts"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        ws: false,
        buffer: false,
        // Silence missing optional native deps pulled in by MetaMask SDK & pino
        "pino-pretty": false,
        "@react-native-async-storage/async-storage": false,
        "encoding": false,
      };
    }
    return config;
  },
};

export default nextConfig;
