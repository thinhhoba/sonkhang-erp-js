/** @type {import('next').NextConfig} */
// Next 14.2.x can reference a missing client manifest while copying the
// standalone output for a route group on Windows.  Production and CI build in
// Linux (the Docker builder), where standalone remains enabled and verified.
// Set NEXT_FORCE_STANDALONE=1 only when a Windows standalone artifact is
// explicitly needed for diagnosis.
const useStandalone =
  process.platform !== "win32" || process.env.NEXT_FORCE_STANDALONE === "1";

const nextConfig = {
  output: useStandalone ? "standalone" : undefined,
  reactStrictMode: false,
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "rc-pagination",
    "rc-picker",
    "rc-util",
    "rc-tree",
    "rc-table",
  ],
  async rewrites() {
    return [
      { source: "/overview", destination: "/dashboard" },
      { source: "/purchasing/suppliers", destination: "/procurement/suppliers" },
      { source: "/purchasing/purchase-orders", destination: "/procurement/orders" },
      { source: "/purchasing/invoices/:path*", destination: "/inventory/invoices/:path*" },
      { source: "/purchasing/invoices", destination: "/inventory/invoices" },
      { source: "/inventory/stocktakes", destination: "/inventory/stocktake" },
      { source: "/inventory/issues", destination: "/inventory/damaged" },
      { source: "/delivery/dispatch", destination: "/logistics/orders" },
      { source: "/delivery/trips", destination: "/logistics/trips" },
      { source: "/delivery/vehicles", destination: "/logistics/vehicles" },
      { source: "/finance/documents", destination: "/documents" },
      { source: "/finance/payroll", destination: "/hr-misa/payroll" },
      { source: "/workspace/profile", destination: "/profile" },
      {
        source: "/admin/:path*",
        destination: "/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
