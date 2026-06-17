import type { NextConfig } from "next"

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // TODO: remove after cleaning up component-level strict errors
    ignoreBuildErrors: true,
  },
  compress: false,
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.app', '*.ngrok.io'],
  experimental: {
    preloadEntriesOnStart: false,
  },
  serverExternalPackages: [
    'pg',
    'corsair',
    '@corsair-dev/gmail',
    '@corsair-dev/googlecalendar',
    '@corsair-dev/googledrive',
    '@corsair-dev/github',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
