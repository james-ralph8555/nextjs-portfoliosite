/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate a fully static site (Static HTML export)
  output: 'export',
  images: {
    // Required for static export when using next/image
    unoptimized: true,
  },
};

module.exports = nextConfig;
