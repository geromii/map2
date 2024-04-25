const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@/components'] = path.join(__dirname, 'src/components');
    config.resolve.alias['@/lib/utils'] = path.join(__dirname, 'src/lib/utils');
    config.resolve.alias['@/app'] = path.join(__dirname, 'src/app');  // Add this line
    return config;
  }
};

module.exports = nextConfig;
