/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/core", "@repo/infra"],
  serverExternalPackages: ["@repo/env"],
};

export default nextConfig;
