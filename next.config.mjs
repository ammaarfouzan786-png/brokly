/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The prototype HTML files live at repo root as design reference; ignore them.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
