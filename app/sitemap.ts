import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://v0-themarshallmafia-website.vercel.app"
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/checkout/return`, lastModified: new Date(), changeFrequency: "never", priority: 0.1 },
  ]
}
