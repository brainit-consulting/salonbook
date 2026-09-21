import type { MetadataRoute } from "next";

// Kept out of search on purpose. See the note in src/app/layout.tsx.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
