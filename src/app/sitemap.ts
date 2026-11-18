import { MetadataRoute } from 'next';
import { CANCER_TYPE_PAGES } from '@/lib/cancerTypes';

const SITE = 'https://www.mytrialmatchrx.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number
  ) => ({ url: `${SITE}${path}`, lastModified: now, changeFrequency, priority });

  return [
    page('', 'weekly', 1),
    page('/search', 'daily', 0.9),
    page('/trials', 'daily', 0.9),
    ...CANCER_TYPE_PAGES.map((c) => page(`/trials/${c.slug}`, 'daily', 0.8)),
    page('/how-it-works', 'monthly', 0.7),
    page('/technology', 'monthly', 0.6),
    page('/about', 'monthly', 0.6),
    page('/for-research-sites', 'monthly', 0.6),
    page('/legal/terms', 'monthly', 0.3),
    page('/legal/privacy', 'monthly', 0.3),
    page('/legal/disclaimer', 'monthly', 0.3),
    page('/legal/hipaa', 'monthly', 0.3),
  ];
}
