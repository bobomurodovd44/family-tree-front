import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Person photos are served as presigned URLs from the private S3 bucket. Allow just that
    // host; `search` is intentionally omitted so the presigned query string (X-Amz-*) passes.
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "family-tree-724208364000-eu-north-1-an.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
