import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiniela Betfine",
  description: "Participa en la quiniela de Betfine y gana premios",
  keywords: [
    "quiniela",
    "betfine",
    "apuestas",
    "fútbol",
    "premios",
    "deportes"
  ],
  openGraph: {
    title: "Quiniela Betfine",
    description: "Participa en la quiniela de Betfine y gana premios.",
    url: "https://www.betfine24quiniela.com/", // Cambia por tu dominio real
    siteName: "Quiniela Betfine",
    images: [
      {
        url: "	https://assets.betfine24.com/sites/betfine24/Desktop.svg", // Cambia por tu imagen real
        width: 1200,
        height: 630,
        alt: "Quiniela Betfine",
      }
    ],
    locale: "es_ES",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiniela Betfine",
    description: "Participa en la quiniela de Betfine y gana premios.",
    images: ["	https://assets.betfine24.com/sites/betfine24/Desktop.svg"], // Cambia por tu imagen real
    site: "@betfine", // Cambia por tu usuario real
  },
  authors: [{ name: "Betfine", url: "https://www.betfine24quiniela.com/" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
