const { i18n } = require('../next-i18next.config.js')

module.exports = {
  i18n,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // config.target = 'electron-renderer';
      config.target = "web";
    }

    return config;
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "store-images.s-microsoft.com",
      },
    ],
  },
};
