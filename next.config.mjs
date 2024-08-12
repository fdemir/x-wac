/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: "image.tmdb.org"
      }
    ]
  }
};

export default nextConfig;
