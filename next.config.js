/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: true,
    domains: ['yt3.ggpht.com'],
  },
}

module.exports = nextConfig
