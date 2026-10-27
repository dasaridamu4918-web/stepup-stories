import type { MetadataRoute } from "next";
import { getPublishedCollections, getPublishedProducts } from "@/lib/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://stepup-stories.vercel.app";

  const [collections, products] = await Promise.all([
    getPublishedCollections(),
    getPublishedProducts()
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/concierge`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 }
  ];

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((col) => ({
    url: `${baseUrl}/catalog?collection=${encodeURIComponent(col.slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
    url: `${baseUrl}/products/${encodeURIComponent(prod.slug)}`,
    lastModified: new Date(prod.updated_at || prod.created_at),
    changeFrequency: "weekly",
    priority: 0.85
  }));

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
