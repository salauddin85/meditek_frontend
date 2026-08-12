/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack SVG support (Next.js 16+ default bundler)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.lorem.space",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/dashboard/reception/cash-drawer",
        destination: "/dashboard/reception/cash_drawer",
        permanent: true,
      },
      {
        source: "/dashboard/reception/cash%20drawer",
        destination: "/dashboard/reception/cash_drawer",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
