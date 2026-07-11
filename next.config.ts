import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Person photos are sent through the savePerson server action as multipart FormData.
      // The default 1MB cap only fits a single small image; raise it so a batch of full-size
      // gallery photos (each capped at 8MB by the uploads service) can be submitted together.
      bodySizeLimit: "40mb",
    },
  },
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
