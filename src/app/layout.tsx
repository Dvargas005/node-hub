import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

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
    "Design, web development and marketing by subscription. Powered by Nouvos.",
  openGraph: {
    title: "N.O.D.E. — Network Organized Delivery Engine",
    description:
      "Design, web development and marketing by subscription. Powered by Nouvos.",
    url: "https://node.nouvos.one",
    siteName: "N.O.D.E. by Nouvos",
    locale: "en_US",
    type: "website",
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
        {/* Inline fallback — guarantees dark bg even if CSS fails to load */}
        <style dangerouslySetInnerHTML={{ __html: "body{background:#130A06;color:#F5F6FC}" }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFC919" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#130A06] text-[#F5F6FC] antialiased">
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
