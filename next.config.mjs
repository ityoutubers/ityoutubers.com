/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: false,
    domains: ["yt3.ggpht.com", "*.ytimg.com"],
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

export default nextConfig;
