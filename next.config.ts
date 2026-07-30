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
  fallbacks: {
    document: "/offline",
  },
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
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
  },
  experimental: {
    // Tree-shake these packages to sub-path imports only. Covers lucide-react,
    // react-icons, framer-motion (already present) plus the @tanstack suite.
    // chart.js is excluded because it has a custom registration pattern that
    // conflicts with sub-path optimisation — it is already dynamically imported
    // inside DashboardTrafficChart and never lands in the initial bundle.
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
      // Isolate heavy vendor libraries into dedicated async chunks so they are
      // never included in the main/initial JS bundle.
      const cacheGroups =
        config.optimization?.splitChunks &&
        typeof config.optimization.splitChunks === "object"
          ? (config.optimization.splitChunks.cacheGroups as Record<
              string,
              unknown
            >)
          : null;

      if (cacheGroups) {
        // Leaflet + react-leaflet — map tiles are only needed on the dashboard
        // and are already behind a dynamic import; this guarantees they are
        // isolated even if a future static import accidentally slips in.
        cacheGroups["leaflet"] = {
          name: "vendor-leaflet",
          test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        // chart.js — registered and instantiated lazily inside an effect;
        // this chunk will only be fetched when the chart canvas mounts.
        cacheGroups["chartjs"] = {
          name: "vendor-chartjs",
          test: /[\\/]node_modules[\\/]chart\.js[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        // framer-motion — loaded lazily via MotionWrapper dynamic import;
        // kept in its own chunk to avoid inflating the default vendor bundle.
        cacheGroups["framerMotion"] = {
          name: "vendor-framer-motion",
          test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
          chunks: "all" as const,
          enforce: true,
          priority: 30,
        };

        // @tanstack suite — table + query are already deferred behind dynamic
        // imports; this ensures the chunk boundary is hard even if tree-shaking
        // doesn't remove all references.
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
