import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withPwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /\/(relayers|logs|contracts)(\/.*)?$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "page-shells",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: false,
  compress: true,
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
  productionBrowserSourceMaps: false,
  turbopack: {},
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "stellar.org" },
      { protocol: "https", hostname: "cryptologos.cc" },
      { protocol: "https", hostname: "cdn.stellar.org" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "@tanstack/react-table",
      "@tanstack/react-query",
      "@tanstack/react-virtual",
    ],
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      const cacheGroups =
        config.optimization?.splitChunks &&
        typeof config.optimization.splitChunks === "object"
          ? (config.optimization.splitChunks.cacheGroups as Record<
              string,
              unknown
            >)
          : null;

      if (cacheGroups) {
        cacheGroups["leaflet"] = {
          name: "vendor-leaflet",
          test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        cacheGroups["chartjs"] = {
          name: "vendor-chartjs",
          test: /[\\/]node_modules[\\/]chart\.js[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        cacheGroups["framerMotion"] = {
          name: "vendor-framer-motion",
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        cacheGroups["tanstack"] = {
          name: "vendor-tanstack",
          test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 25,
        };
      }
    }

    return config;
  },
};

export default withBundleAnalyzerConfig(withPwaConfig(nextConfig));
