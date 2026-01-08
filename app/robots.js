export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/sign-in/',
          '/sign-up/',
          '/teams/',
          '/prompts/',
          '/tags/',
        ],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 