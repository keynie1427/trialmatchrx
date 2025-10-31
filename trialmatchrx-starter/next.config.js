/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          // Expose the current URL so our server component can parse search params
          { key: "x-current-url", value: ":path*" }
        ]
      }
    ]
  }
};
module.exports = nextConfig;
