const SITE_URL = "https://cartvan.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/checkout",
          "/order-summary/",
          "/orders",
          "/profile",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
