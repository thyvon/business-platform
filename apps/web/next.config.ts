import path from "node:path";
import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: true,
  transpilePackages: ["@business/contracts"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sms.mjqeducation.edu.kh", pathname: "/assets/images/logo/**" },
    ],
  },
  turbopack: { root: path.resolve(import.meta.dirname, "../..") },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
