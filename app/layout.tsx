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
    "The Marshall Mafia is a premium social deduction card game for up to 22 players. Villagers versus Mafia — bluff, deceive, survive and eliminate. 54 premium cards, 6 hidden roles, 20+ songs. The ultimate game night experience. Order yours in the UK today.",
  keywords: [
    "The Marshall Mafia",
    "Marshall Mafia card game",
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
    "best party games 2026",
    "card games for adults",
    "fun party games",
    "social game",
    "game night",
    "indie card game",
    "card game shop",
    "card game shop UK",
    "card game shop online",
    "buy board game UK",
    "new card game 2025",
    "unique card game",
    "role card game",
    "hidden role game",
    "secret role game",
    "bluffing game",
    "detective game",
    "elimination game",
    "family card game",
    "card game for large groups",
    "card game 22 players",
    "card game 10 players",
    "card game gifts UK",
    "premium card game",
    "FSC card game",
    "card game with music",
    "game for teens",
    "game for adults",
    "game for all ages",
    "mafia game cards",
    "hidden identity game",
    "social deduction party game",
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
      "Villagers vs Mafia. Bluff, deceive, survive, eliminate. A premium social deduction card game for up to 22 players — 54 FSC-certified cards, 6 hidden roles, 20+ original songs. The ultimate game night.",
    images: [
      {
        url: "/images/tmm_picture_1.jpg",
        width: 1200,
        height: 630,
        alt: "The Marshall Mafia Card Game — Social Deduction for up to 22 Players",
        type: "image/jpeg",
      },
    ],
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Marshall Mafia — Social Deduction Card Game",
    description:
      "Villagers vs Mafia. Bluff, deceive, survive, eliminate. The ultimate game night card game for up to 22 players.",
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
      { url: "/themarshallmafia.black.gif", media: "(prefers-color-scheme: dark)",  type: "image/gif" },
      { url: "/themarshallmafia.white.gif", media: "(prefers-color-scheme: light)", type: "image/gif" },
      { url: "/themarshallmafia.black.gif", type: "image/gif" },
    ],
    apple: [{ url: "/themarshallmafia.black.gif", type: "image/gif" }],
    shortcut: "/themarshallmafia.black.gif",
  },
  manifest: "/manifest.json",
}

// ── Structured Data ──────────────────────────────────────────────────────────

const jsonLdProduct = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "The Marshall Mafia",
  description:
    "A premium social deduction card game for up to 22 players. Villagers versus Mafia — bluff, deceive, survive and eliminate through rounds of sleeping, discussion and voting. 54 FSC-certified 410gsm cards, 6 hidden roles (Marshall, Mafia, Villager, Detective, Angel, Jester), 20+ original songs, 8 custom house rules.",
  brand: { "@type": "Brand", name: "The Marshall Mafia" },
  category: "Card Games",
  keywords: "card game, social deduction, mafia, party game, group game, hidden role, bluffing",
  image: [
    `${siteUrl}/images/tmm_picture_1.jpg`,
    `${siteUrl}/images/tmm_product_render_1.png`,
    `${siteUrl}/images/tmm_product_render_2.png`,
  ],
  url: siteUrl,
  sku: "TMM-STANDARD-001",
  offers: {
    "@type": "Offer",
    url: siteUrl,
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: "The Marshall Mafia",
      url: siteUrl,
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "16",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Katie R" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Highly recommend getting this game! It's so much fun to play with friends and the physical cards make it much easier to follow along. I love the character design and the music that comes with this pack. It is now the go to game in my friendship group and we can't get enough!",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Isabella M" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "The Marshall Mafia is amazing for group bonding, I played this game with my youth group and it was amazing... it really helped everyone to get to know each other and created fun memories!",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Samuel A" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "There is nothing like this game on the market. It appeals to all ages, no-one is too young or too old to play… plus the background music makes the experience so much endless fun.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Geoff S" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "Great game, really enjoy the variety of cards in the pack. It's easy for someone new to pick up and understand and is a good game to play in larger groups which is generally hard to find.",
    },
    {
      "@type": "Review",
      author: { "@type": "Person", name: "Alice B" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody:
        "It's a game that in the same breath brings us all together, while we all turn on each other! It reveals so much about everyone's character and makes you crave playing it so you get your own back. I would highly recommend it to anyone who wants to bring some life back into their friendship groups.",
    },
  ],
}

const jsonLdGame = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "The Marshall Mafia",
  description:
    "A premium social deduction card game for up to 22 players. Bluff, deceive, survive and eliminate through rounds of sleeping, discussion and voting. 6 hidden roles including Marshall, Mafia, Villager, Detective, Angel and Jester.",
  url: siteUrl,
  image: `${siteUrl}/images/tmm_picture_1.jpg`,
  numberOfPlayers: { "@type": "QuantitativeValue", minValue: 5, maxValue: 22 },
  audience: {
    "@type": "PeopleAudience",
    suggestedMinAge: 12,
  },
  genre: ["Social Deduction", "Bluffing", "Party Game", "Hidden Role"],
  publisher: {
    "@type": "Organization",
    name: "The Marshall Mafia",
    url: siteUrl,
  },
}

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Marshall Mafia",
  url: siteUrl,
  logo: `${siteUrl}/tmm_themarshallmafia_logo.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    email: "info@themarshallmafia.com",
    contactType: "customer service",
  },
  sameAs: [
    "https://linktr.ee/themarshallmafia",
    "https://linktr.ee/themarshallmafia.music",
    "https://open.spotify.com/playlist/3IciRcKF72CRT6MHI6C6Ry",
  ],
}

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "The Marshall Mafia",
  url: siteUrl,
  description: "Official site for The Marshall Mafia — premium social deduction card game.",
  inLanguage: "en-GB",
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

const jsonLdFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is The Marshall Mafia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Marshall Mafia is a premium social deduction card game where Villagers must identify and eliminate the hidden Mafia before being wiped out. Players are secretly assigned roles — Marshall, Mafia, Villager, Detective, Angel, or Jester — and play through rounds of sleeping, discussion, and voting.",
      },
    },
    {
      "@type": "Question",
      name: "How many players can play The Marshall Mafia?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Marshall Mafia supports 5 to 22 players, making it one of the most scalable social deduction card games available. It's perfect for small gatherings and large group events alike.",
      },
    },
    {
      "@type": "Question",
      name: "What roles are in The Marshall Mafia card game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Marshall Mafia features 6 hidden roles: the narrating Marshall, the deadly Mafia, the innocent Villager, the investigative Detective, the saving Angel, and the chaotic Jester. Each role has unique abilities and win conditions.",
      },
    },
    {
      "@type": "Question",
      name: "What is included in The Marshall Mafia box?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The box contains 54 premium 410gsm FSC-certified cards, support for up to 22 players, 20+ original songs on the accompanying playlist, 17 death cards, 8 custom house rules, and a classy matt-textured tucked box.",
      },
    },
    {
      "@type": "Question",
      name: "What age is The Marshall Mafia suitable for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Marshall Mafia is suitable for ages 12 and up. The game appeals to all ages — from teenagers to grandparents — and is a great choice for family game nights and adult gatherings alike.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I buy The Marshall Mafia card game?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can buy The Marshall Mafia directly from the official website at themarshallmafia.com. It ships within the UK and internationally.",
      },
    },
    {
      "@type": "Question",
      name: "Is The Marshall Mafia UKCA and CE certified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Marshall Mafia carries both the UKCA mark (required for England, Scotland and Wales) and CE mark (required for EU customers), and is fully compliant with the General Product Safety Regulation (GPSR). The cards are FSC-certified, printed by Ivory Graphics Ltd.",
      },
    },
  ],
}

const jsonLdVideo = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "The Marshall Mafia — Product Showcase Animation",
  description:
    "An animated product showcase of The Marshall Mafia social deduction card game, featuring the premium 410gsm cards, 6 hidden roles, and game design.",
  thumbnailUrl: `${siteUrl}/images/tmm_product_render_1.png`,
  contentUrl: `${siteUrl}/videos/tmm_product_showcase_animation_1.mp4`,
  uploadDate: "2025-01-01",
  publisher: {
    "@type": "Organization",
    name: "The Marshall Mafia",
    logo: { "@type": "ImageObject", url: `${siteUrl}/tmm_themarshallmafia_logo.svg` },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB">
      <head>
        {/* Preload MarkerBold so it's ready before first paint — eliminates font swap flash */}
        <link rel="preload" as="font" href="/fonts/asset_font_bold_marker.ttf" type="font/truetype" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGame) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVideo) }} />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
