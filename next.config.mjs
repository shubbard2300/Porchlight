/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async redirects() {
    return [
      { source: '/signup', destination: '/join', permanent: false },
      { source: '/account', destination: '/profile', permanent: false },
    ];
  },
};
export default nextConfig;
