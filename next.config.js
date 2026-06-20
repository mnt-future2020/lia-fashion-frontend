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
      
    ],
  },
  // Add rewrites for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.liafashion.in/api/:path*', // Proxy to Laravel backend
      },
    ]
  },
}

module.exports = nextConfig
