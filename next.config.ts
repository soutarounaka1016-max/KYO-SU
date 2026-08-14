import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  basePath: isGitHubPages ? "/KYO-SU" : "",
  trailingSlash: true,
};

export default nextConfig;
