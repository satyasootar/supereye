import type { MetadataRoute } from 'next';
import { getSiteUrl, PUBLIC_PAGES } from '@/lib/site/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PAGES.map((page) => ({
    url: `${base}${page.path}`,
    lastModified,
    changeFrequency: page.path === '/' ? 'weekly' : 'monthly',
    priority: page.path === '/' ? 1 : 0.7,
  }));
}
