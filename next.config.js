/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "80mb" }
  }
};
module.exports = nextConfig;
