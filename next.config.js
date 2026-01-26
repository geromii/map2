const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Ignore TypeScript errors in build (convex folder has deep type instantiation issues)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Allow images from Convex storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },

  // Turbopack configuration for path aliases
  turbopack: {
    resolveAlias: {
      '@/components': './src/components',
      '@/lib/utils': './src/lib/utils',
      '@/app': './src/app',
    },
  },

  // Enable source maps for production
  productionBrowserSourceMaps: true,

  // Enable compression for better performance
  compress: true,

  // Optimize JSON imports
  experimental: {
    optimizePackageImports: []
  },
  
  // Add headers for static assets
  async headers() {
    return [
      {
        source: '/map_design_2025_08.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
