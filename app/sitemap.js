// app/sitemap.js
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';

export default async function sitemap() {
  const now = new Date().toISOString();

  const staticRoutes = [
    '/',
    '/prompts',
    '/public',
    '/tags',
    '/privacy',
    '/terms',
    '/sign-in',
    '/sign-up',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
  }));

  // Optional dynamic routes
  const dynamicRoutes = [];
  try {
    // Public prompts (ids)
    const res = await fetch(`${BASE_URL}/api/prompts/public`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      const prompts = data?.prompts || [];
      for (const p of prompts) {
        if (p?.id) {
          dynamicRoutes.push({
            url: `${BASE_URL}/share/${p.id}`,
            lastModified: p.updated_at || now,
          });
        }
      }
    }
  } catch (e) {
    // Swallow errors to avoid breaking sitemap
  }

  return [...staticRoutes, ...dynamicRoutes];
}