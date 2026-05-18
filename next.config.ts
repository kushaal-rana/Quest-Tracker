import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — no iframes of this app allowed
  { key: "X-Frame-Options", value: "DENY" },
  // Block MIME-type sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin in referrer (not full URL) for cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year (only active in production behind TLS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable browser features we don't need
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy
  // Notes:
  //   - 'unsafe-inline' in script-src: required for Next.js RSC hydration inline scripts
  //   - 'unsafe-eval' in script-src: required by some Next.js internals in dev; benign in prod
  //   - connect-src includes Supabase for API + auth + realtime websockets
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
