import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  experimental: {
    optimizePackageImports: [
      "react-icons",
      "ag-grid-react",
      "apexcharts",
    ],
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
