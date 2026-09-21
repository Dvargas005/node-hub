import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/JsonLd";
import {
  ADDRESS,
  AREA_SERVED,
  GEO,
  LEGAL_NAME,
  OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  ORG_NAME,
  PHONE,
  SERVICES,
  SITE_URL,
} from "@/lib/seo";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-lexend",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const DESCRIPTION =
  "Web, app, and software development plus SEO under one flat monthly subscription. A dedicated team of designers, developers, and marketers from Nouvos Solutions.";

export const metadata: Metadata = {
  // Without metadataBase, Next resolves relative OG/canonical URLs against the
  // deployment host, which on Vercel is the preview URL. Pin it to the
  // canonical origin so previews never emit a canonical pointing at themselves.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "N.O.D.E. | Web, App & Software Development by Subscription",
    template: "%s | N.O.D.E. by Nouvos",
  },
  description: DESCRIPTION,
  applicationName: ORG_NAME,
  // The site had no favicon at all (favicon.ico 404), so Google results and
  // Safari showed a generic globe. apple-touch-icon is what iOS uses for
  // home-screen shortcuts, bookmarks, and Siri/Spotlight suggestions.
  // icon-192/512 are also what public/manifest.json has always pointed at.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: { canonical: "/" },
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
  openGraph: {
    title: "N.O.D.E. | Web, App & Software Development by Subscription",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: ORG_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: "N.O.D.E. by Nouvos Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "N.O.D.E. | Web, App & Software Development by Subscription",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

/**
 * Site-wide Organization graph.
 *
 * Rendered server-side on every page on purpose: answer engines read raw HTML
 * and never run JavaScript, so this is the only description of the business
 * they reliably see. `hasOfferCatalog` reads from SERVICES so the schema cannot
 * drift away from the pages that actually exist.
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: ORG_NAME,
  alternateName: ["N.O.D.E.", "NODE by Nouvos", "Network Organized Delivery Engine"],
  legalName: LEGAL_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logos/NOUVOS.ONE_white@2x.png`,
  image: `${SITE_URL}${OG_IMAGE}`,
  description: DESCRIPTION,
  email: "support@nouvos.one",
  parentOrganization: {
    "@type": "Organization",
    name: LEGAL_NAME,
    url: "https://nouvos.one",
  },
  telephone: PHONE,
  address: { "@type": "PostalAddress", ...ADDRESS },
  geo: { "@type": "GeoCoordinates", ...GEO },
  // Must match the Google Business Profile service areas exactly.
  areaServed: AREA_SERVED,
  knowsLanguage: ["en", "es"],
  sameAs: ["https://nouvos.one", "https://www.linkedin.com/company/111339069"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "N.O.D.E. Services",
    itemListElement: SERVICES.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service.name,
        description: service.summary,
        url: `${SITE_URL}/services/${service.slug}`,
      },
    })),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${lexend.variable} ${atkinson.variable} font-sans`}>
      <head>
        {/* Inline fallback - guarantees dark bg even if CSS fails to load */}
        <style dangerouslySetInnerHTML={{ __html: "body{background:#130A06;color:#F5F6FC}" }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFC919" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#130A06] text-[#F5F6FC] antialiased">
        <JsonLd data={organizationSchema} />
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
