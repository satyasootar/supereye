import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compress: false,
  // Allow ngrok (and similar tunnels) to reach HMR / dev assets when developing remotely.
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.io'],
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
