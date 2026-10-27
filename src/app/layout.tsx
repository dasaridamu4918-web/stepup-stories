import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getPublishedCollections, getSiteSettings } from "@/lib/repository";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://stepup-stories.vercel.app";

  const title = `${settings.business_name} | Luxury Timepiece Collections`;
  const description =
    settings.hero_subheadline ||
    "Explore the curated luxury timepiece collections of STEPUP STORIES. Designed with architectural precision and enduring character.";
  const ogImage = settings.og_image_url || "/images/generated/og-backdrop.webp";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: `%s | ${settings.business_name}`
    },
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: settings.business_name,
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${settings.business_name} Luxury Timepieces`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [settings, collections] = await Promise.all([
    getSiteSettings(),
    getPublishedCollections()
  ]);

  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-obsidian text-cream">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader businessName={settings.business_name} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} collections={collections} />
      </body>
    </html>
  );
}
