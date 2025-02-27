import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/calcio',
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
