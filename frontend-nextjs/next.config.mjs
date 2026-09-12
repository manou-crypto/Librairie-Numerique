import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      ...imageHosts,
      // Cloudinary — images produits
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  },

  async rewrites() {
    // En production (Vercel), BACKEND_URL pointe vers Railway.
    // En local (Docker), on retombe sur http://backend:3000.
    const backendUrl = process.env.BACKEND_URL || 'http://backend:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;