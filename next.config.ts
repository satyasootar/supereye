import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compress: false,
  experimental: {
    preloadEntriesOnStart: false,
  },
  serverExternalPackages: [
    'pg',
    'corsair',
    '@corsair-dev/gmail',
    '@corsair-dev/googlecalendar',
  ],
}

export default nextConfig
