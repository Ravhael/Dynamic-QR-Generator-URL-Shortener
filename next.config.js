/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/photo-**',
      },
    ],
  },
  webpack: (config, { isServer, dev }) => {
    // Force non-eval source maps so edge runtime (middleware) can execute code safely.
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    // Enable websocket support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
      }
    }
    return config
  }
}

module.exports = nextConfig