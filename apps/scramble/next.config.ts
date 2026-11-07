import browserslist from "browserslist";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { minimumVersions } from "./lib/browserSupport";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    // Oldest browser versions in the package.json browserslist range, for the outdated-browser warning.
    BROWSER_MINIMUMS: JSON.stringify(minimumVersions(browserslist())),
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
    globalNotFound: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
