/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        // node.nouvos.one is retired — www.nodedev.one is the only host.
        // Kept as a permanent redirect rather than dropping the domain: agreement
        // signing links and transactional emails already sent to clients carry the
        // old host, and those must keep resolving.
        source: "/:path*",
        has: [{ type: "host", value: "node.nouvos.one" }],
        destination: "https://www.nodedev.one/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Prevent browser from caching HTML pages with stale CSS/JS version params
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
