import type { NextConfig } from "next";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const development = process.env.NODE_ENV === "development";
const policy = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'",
  "form-action 'self'", "font-src 'self'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `connect-src 'self' ${supabaseOrigin} ${development ? "ws: wss:" : ""}`,
  `script-src 'self' 'unsafe-inline' ${development ? "'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'", "frame-src 'none'",
].join("; ");

const config: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseOrigin ? [{ protocol: new URL(supabaseOrigin).protocol === "http:" ? "http" : "https", hostname: new URL(supabaseOrigin).hostname, port: new URL(supabaseOrigin).port, pathname: "/storage/v1/object/public/restaurant-media/**" }] : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: [
        { key: "Content-Security-Policy", value: policy },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};
export default config;
