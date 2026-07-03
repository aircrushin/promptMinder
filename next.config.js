/** @type {import('next').NextConfig} */
const path = require("path");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  sw: "service-worker.js",
  buildExcludes: [/middleware-manifest.json$/],
});

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (process.env.BUNDLE_ANALYZE) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "static",
          reportFilename: isServer
            ? "../analyze/server.html"
            : "./analyze/client.html",
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "emqozkcwoekqiibyempf.supabase.co",
      },
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn.buymeacoffee.com",
        pathname: "/buttons/**",
      },
      {
        protocol: "https",
        hostname: "static.mkanime.ai",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enhanced image optimization
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable image optimization for static images
    unoptimized: false,
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  
  // Output file tracing (moved from experimental in Next.js 16)
  outputFileTracingRoot: path.join(__dirname),

  // Enable gzip compression
  compress: true,

  // Enable static optimization
  output: "standalone",

  // modularizeImports removed - Next.js 16 handles this automatically via optimizePackageImports

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    }
  }
};

module.exports = withBundleAnalyzer(withPWA(nextConfig));
