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
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
