import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'service.digitalks.co.in',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3688',
        pathname: '/**',
      }
    ],
  },

  experimental: {
    optimizePackageImports: [
      "react-icons",
      "ag-grid-react",
      "apexcharts",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack config (required if using custom loaders)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              memo: true,
              svgo: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
