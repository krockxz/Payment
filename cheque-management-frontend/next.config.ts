import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Set workspace root to silence Turbopack warning about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
  // Configure development options
  ...(process.env.NODE_ENV === 'development' && {
    logging: {
      fetches: {
        fullUrl: false,
      },
    },
  }),
  // Add proxy configuration for API calls
  async rewrites() {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://payment-yjxf.onrender.com'
      : 'http://localhost:5000';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
