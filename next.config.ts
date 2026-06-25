import type { NextConfig } from 'next'
import { execSync } from 'child_process'

function getFeVersion() {
  if (process.env.NEXT_PUBLIC_FE_VERSION)
    return process.env.NEXT_PUBLIC_FE_VERSION
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
    }).trim()
    return `dev-${hash}`
  } catch {
    return 'dev'
  }
}

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/v-ui',
  assetPrefix: '/v-ui',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_FE_VERSION: getFeVersion(),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
