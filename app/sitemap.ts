import type { MetadataRoute } from 'next';
import { MEASURES } from '@/data/measures';

// Sitemap generated from the data: each observatory sheet has its own
// indexable URL (this is the product's organic acquisition engine).

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://criblepolitique.fr';

export default function sitemap(): MetadataRoute.Sitemap {
    const staticRoutes = [
        '',
        '/test',
        '/crible',
        '/concepts',
        '/methodology',
        '/confidentialite',
        '/a-propos',
        '/partners',
        '/legal'
    ].map((route) => ({
        url: `${BASE}${route}`,
        changeFrequency: 'weekly' as const,
        priority: route === '' || route === '/test' ? 1 : 0.7
    }));

    const ficheRoutes = MEASURES.map((m) => ({
        url: `${BASE}/crible/${m.id}`,
        changeFrequency: 'monthly' as const,
        priority: 0.8
    }));

    return [...staticRoutes, ...ficheRoutes];
}
