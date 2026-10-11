import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Halaman pribadi dan admin tidak untuk diindeks (NFR-22)
        disallow: ["/akun", "/admin", "/jual", "/onboarding", "/api/", "/auth/", "/masuk", "/diblokir"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
