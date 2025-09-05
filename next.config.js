const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@/components'] = path.join(__dirname, 'src/components');
    config.resolve.alias['@/lib/utils'] = path.join(__dirname, 'src/lib/utils');
    config.resolve.alias['@/app'] = path.join(__dirname, 'src/app');  // Add this line
    return config;
  },
  
  // Enable source maps for production
  productionBrowserSourceMaps: true,
  
  // Enable compression for better performance
  compress: true,
  
  // Optimize JSON imports
  experimental: {
    optimizePackageImports: ['mathjs']
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
