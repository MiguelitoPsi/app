import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configurações para PWA e CORS
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, must-revalidate',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=604800',
        },
      ],
    },
    {
      // Headers CORS para API routes
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NEXT_PUBLIC_APP_URL || 'https://app.guiadomiguel.com.br',
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, X-Requested-With',
        },
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true',
        },
      ],
    },
  ],
}

export default nextConfig
