import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site/config';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/privacy', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/workspace',
          '/workspace/',
          '/admin',
          '/admin/',
          '/login',
          '/api/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/about', '/privacy', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/workspace', '/admin', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/about', '/privacy', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/workspace', '/admin', '/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/about', '/privacy', '/terms', '/llms.txt', '/llms-full.txt'],
        disallow: ['/workspace', '/admin', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/about', '/privacy', '/terms'],
        disallow: ['/workspace', '/admin', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
