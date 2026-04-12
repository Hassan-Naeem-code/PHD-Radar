import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { PWARegister } from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhDRadar — Find your PhD advisor before you apply",
  description:
    "AI-powered platform to discover professors with active funding, analyze research fit, and craft personalized outreach emails for PhD applications.",
  keywords: [
    "PhD",
    "professor finder",
    "research advisor",
    "PhD applications",
    "funding",
    "graduate school",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PhDRadar",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://phdradar.com",
    siteName: "PhDRadar",
    title: "PhDRadar — Find your PhD advisor before you apply",
    description: "AI-powered platform to discover professors with active funding, analyze research fit, and craft personalized outreach emails for PhD applications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhDRadar — Find your PhD advisor before you apply",
    description: "AI-powered platform to discover professors with active funding and craft personalized outreach emails.",
  },
};

export const viewport: Viewport = {
  themeColor: "#4361ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Skip navigation link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
        <CookieConsent />
        <PWARegister />
      </body>
    </html>
  );
}
