/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output mode: standalone for Render, export for Cloudflare Pages
  // Set via NEXT_OUTPUT_MODE environment variable
  ...(process.env.NEXT_OUTPUT_MODE && { output: process.env.NEXT_OUTPUT_MODE }),

  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  },

  // Rewrites for API proxy (when frontend is on Cloudflare)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Only proxy if API URL is different from app URL (split deployment)
    if (apiUrl && apiUrl !== process.env.NEXT_PUBLIC_APP_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }

    return [];
  },

  // Headers for CORS (when needed)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
