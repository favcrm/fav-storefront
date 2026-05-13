import { createFavCRM } from "$lib/favcrm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, url }) => {
  const sdk = createFavCRM(fetch);
  const baseUrl = url.origin;

  // We will fetch lists concurrently where possible
  const [blogs, events, products, services] = await Promise.allSettled([
    sdk.blog.list({ limit: 100 }).catch(() => null),
    sdk.events.list().catch(() => []),
    sdk.shop.listProducts({ limit: 100 }).catch(() => []),
    sdk.bookings.listServices().catch(() => []),
  ]);

  const urls: {
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }[] = [
    { loc: "/", priority: 1.0, changefreq: "daily" },
    { loc: "/blog", priority: 0.8, changefreq: "daily" },
    { loc: "/shop", priority: 0.8, changefreq: "daily" },
    { loc: "/events", priority: 0.8, changefreq: "daily" },
    { loc: "/bookings", priority: 0.8, changefreq: "daily" },
  ];

  if (blogs.status === "fulfilled" && blogs.value?.items) {
    blogs.value.items.forEach((post) => {
      urls.push({
        loc: "/blog/" + post.slug,
        lastmod: post.updatedAt || post.createdAt,
        priority: 0.7,
        changefreq: "weekly",
      });
    });
  }

  if (events.status === "fulfilled" && Array.isArray(events.value)) {
    events.value.forEach((evt) => {
      urls.push({
        loc: "/events/" + evt.slug,
        priority: 0.7,
        changefreq: "weekly",
      });
    });
  }

  if (products.status === "fulfilled" && Array.isArray(products.value)) {
    products.value.forEach((prod) => {
      urls.push({
        loc: "/shop/" + prod.slug,
        priority: 0.7,
        changefreq: "weekly",
      });
    });
  }

  if (services.status === "fulfilled" && Array.isArray(services.value)) {
    services.value.forEach((service) => {
      urls.push({
        loc: "/bookings/" + service.id, // Assuming bookings use ID based on the routes structure
        priority: 0.7,
        changefreq: "weekly",
      });
    });
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8" ?>\\n' +
    '<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\\n' +
    urls
      .map(
        (u) =>
          "  <url>\\n" +
          "    <loc>" +
          baseUrl +
          u.loc +
          "</loc>\\n" +
          (u.lastmod
            ? "    <lastmod>" +
              new Date(u.lastmod).toISOString() +
              "</lastmod>\\n"
            : "") +
          (u.changefreq
            ? "    <changefreq>" + u.changefreq + "</changefreq>\\n"
            : "") +
          (u.priority ? "    <priority>" + u.priority + "</priority>\\n" : "") +
          "  </url>",
      )
      .join("\\n") +
    "\\n</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
