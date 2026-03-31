import type { Metadata } from "next";
import { Lexend, Atkinson_Hyperlegible } from "next/font/google";
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
    "Creative design, web development & marketing powered by Nouvos",
  openGraph: {
    title: "N.O.D.E. — Network Organized Delivery Engine",
    description:
      "Creative design, web development & marketing powered by Nouvos",
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
    <html lang="en" className={`${lexend.variable} ${atkinson.variable}`}>
      <body className="bg-[#130A06] text-[#F5F6FC] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
