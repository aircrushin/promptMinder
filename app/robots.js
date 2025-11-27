export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    host: process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com',
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://prompt-minder.com'}/sitemap.xml`,
  };
} 