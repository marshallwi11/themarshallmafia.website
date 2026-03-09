import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://v0-themarshallmafia-website.vercel.app"

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "The Marshall Mafia",
    template: "%s | The Marshall Mafia",
  },
  description: "A premium social deduction card game. Villagers vs Mafia — survive, deceive, and eliminate. Available now.",
  keywords: ["card game", "social deduction", "mafia game", "party game", "the marshall mafia", "board game"],
  authors: [{ name: "marshallwi11", url: "https://linktr.ee/marshallwi11" }],
  creator: "marshallwi11",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "The Marshall Mafia",
    title: "The Marshall Mafia — Social Deduction Card Game",
    description: "Villagers vs Mafia. Deceive, survive, eliminate. A premium social deduction card game.",
    images: [{ url: "/images/tmm_picture_1.jpg", width: 1200, height: 630, alt: "The Marshall Mafia Card Game" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Marshall Mafia — Social Deduction Card Game",
    description: "Villagers vs Mafia. Deceive, survive, eliminate.",
    images: ["/images/tmm_picture_1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
      </head>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
