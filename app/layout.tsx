import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://themarshallmafia.com"

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "The Marshall Mafia | Social Deduction Card Game",
    template: "%s | The Marshall Mafia",
  },
  description:
    "The Marshall Mafia is a premium social deduction card game for 5–12 players. Villagers versus Mafia — deceive, survive, and eliminate. Fast-paced, thrilling game night entertainment. Order yours today.",
  keywords: [
    "The Marshall Mafia",
    "card game",
    "social deduction game",
    "mafia card game",
    "party card game",
    "party game for adults",
    "group card game",
    "multiplayer card game",
    "deception card game",
    "strategy party game",
    "villagers vs mafia",
    "mafia party game",
    "werewolf card game",
    "buy card game",
    "card game gift",
    "card game UK",
    "best party games 2025",
    "card games for adults",
    "fun party games",
    "social game",
    "game night",
    "indie card game",
    "card game online",
    "card game shop",
    "card game shop UK",
    "card game shop online",
    "buy board game",
    "new card game",
    "unique card game",
    "role card game",
    "hidden role game",
    "secret role game",
    "bluffing game",
    "detective game",
    "elimination game",
    "marshallwi11",
    "TMM card game",
  ],
  authors: [{ name: "marshallwi11", url: "https://linktr.ee/marshallwi11" }],
  creator: "marshallwi11",
  publisher: "The Marshall Mafia",
  category: "Card Games",
  classification: "Card Game / Party Game / Social Deduction",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "The Marshall Mafia",
    title: "The Marshall Mafia — Social Deduction Card Game",
    description:
      "Villagers vs Mafia. Deceive, survive, eliminate. A premium social deduction card game for 5–12 players — the ultimate game night experience.",
    images: [
      {
        url: "/images/tmm_picture_1.jpg",
        width: 1200,
        height: 630,
        alt: "The Marshall Mafia Card Game — Social Deduction",
        type: "image/jpeg",
      },
    ],
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Marshall Mafia — Social Deduction Card Game",
    description:
      "Villagers vs Mafia. Deceive, survive, eliminate. The ultimate game night card game.",
    images: ["/images/tmm_picture_1.jpg"],
    creator: "@marshallwi11",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "32x32" },
      { url: "/icon.svg", sizes: "16x16" },
    ],
    apple: [{ url: "/icon.svg", sizes: "180x180" }],
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.json",
}

const jsonLdProduct = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "The Marshall Mafia",
  description:
    "A premium social deduction card game for 5–12 players. Villagers versus Mafia — deceive, survive, and eliminate through rounds of sleeping, discussion and voting.",
  brand: { "@type": "Brand", name: "The Marshall Mafia" },
  category: "Card Games",
  keywords: "card game, social deduction, mafia, party game, group game",
  image: `${siteUrl}/images/tmm_picture_1.jpg`,
  url: siteUrl,
  offers: {
    "@type": "Offer",
    url: siteUrl,
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "The Marshall Mafia" },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    reviewCount: "1",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Isabella M" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "The Marshall Mafia is amazing for group bonding. I played this game with my youth group and it really helped everyone to get to know each other and created fun memories!",
    },
  ],
}

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Marshall Mafia",
  url: siteUrl,
  logo: `${siteUrl}/tmm_themarshallmafia_logo.svg`,
  sameAs: [
    "https://linktr.ee/themarshallmafia",
    "https://linktr.ee/themarshallmafia.music",
    "https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry",
  ],
}

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "The Marshall Mafia",
      item: siteUrl,
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
