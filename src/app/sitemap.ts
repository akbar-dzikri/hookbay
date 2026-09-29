import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4310';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ['', '/demo', '/docs', '/login', '/signup'].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/docs' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }));
}
