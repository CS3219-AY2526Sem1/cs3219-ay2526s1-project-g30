import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  cacheComponents: true,
 };

export default nextConfig;
