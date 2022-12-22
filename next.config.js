/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: false,
    domains: ["yt3.ggpht.com", "i.ytimg.com"],
  },
  async redirects() {
    return [
      {
        source: "/other-channels",
        destination: "/all-channels",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
