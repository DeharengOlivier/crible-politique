import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://criblepolitique.fr';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Shared profiles are deliberately chosen personal data:
                // do not index profile URLs or comparisons.
                disallow: ['/p/', '/compare']
            }
        ],
        sitemap: `${BASE}/sitemap.xml`
    };
}
