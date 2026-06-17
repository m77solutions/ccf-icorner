import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  ...(isProduction && {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,
    assetPrefix: '',
  }),
};

export default nextConfig;
