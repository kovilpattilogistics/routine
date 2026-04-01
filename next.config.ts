import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,

  // Allow DiceBear avatars (currently still being used as fallback)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },

  // Enforce strict-mode for catching React bugs early
  reactStrictMode: true,

  // Aggressive caching headers for static assets
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  experimental: {
    // Inline CSS for critical-path styles — reduces render-blocking
    optimizeCss: false, // requires 'critters' package; enable if you install it
  },
};

export default nextConfig;
