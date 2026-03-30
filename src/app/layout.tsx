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
  title: "N.O.D.E. — Tu equipo digital. Una suscripción.",
  description:
    "Diseño, desarrollo web y marketing digital por suscripción mensual. Sin contratos, sin sorpresas. Powered by Nouvos.",
  openGraph: {
    title: "N.O.D.E. — Tu equipo digital. Una suscripción.",
    description:
      "Diseño, desarrollo web y marketing digital por suscripción mensual.",
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
    <html lang="es" className={`${lexend.variable} ${atkinson.variable}`}>
      <body className={atkinson.className}>{children}</body>
    </html>
  );
}
