/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'api.liafashion.in',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
  },
  // Add rewrites for API proxy (uses NEXT_PUBLIC_BACKEND_URL so local dev hits the local backend)
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.liafashion.in'
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`, // Proxy to Laravel backend
      },
    ]
  },
}

module.exports = nextConfig
