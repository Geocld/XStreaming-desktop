/** @type {import('next').NextConfig} */
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // config.target = 'electron-renderer';
      config.target = "web";
    }

    return config;
  },
  trailingSlash: true,

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
