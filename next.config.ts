import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, far too small for a scanned title deed or an
      // inspection report PDF. Kept in step with the Storage bucket's own
      // file_size_limit (see supabase/04_storage.sql) so the two don't
      // disagree about what counts as "too big."
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
