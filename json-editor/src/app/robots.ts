import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://json-editor-inky.vercel.app/sitemap.xml",
    host: "https://json-editor-inky.vercel.app",
  };
}
