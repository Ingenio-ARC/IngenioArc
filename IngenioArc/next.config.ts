import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  allowedDevOrigins: ['*', 'eda4-190-9-183-30.ngrok-free.app', 'localhost'], // Add your dev origin here
  reactStrictMode: false,
};

export default nextConfig;
