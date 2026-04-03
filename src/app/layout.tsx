import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "N.O.D.E. — Network Organized Delivery Engine",
  description:
    "Diseño, desarrollo web y marketing por suscripción. Powered by Nouvos.",
  openGraph: {
    title: "N.O.D.E. — Network Organized Delivery Engine",
    description:
      "Diseño, desarrollo web y marketing por suscripción. Powered by Nouvos.",
    url: "https://node.nouvos.one",
    siteName: "N.O.D.E. by Nouvos",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${lexend.variable} ${atkinson.variable} font-sans`}>
      <head>
        {/* Inline fallback — guarantees dark bg even if CSS fails to load */}
        <style dangerouslySetInnerHTML={{ __html: "body{background:#130A06;color:#F5F6FC}" }} />
      </head>
      <body className="bg-[#130A06] text-[#F5F6FC] antialiased overflow-x-hidden">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
