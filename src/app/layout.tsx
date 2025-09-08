import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/page/Header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Via Nexo - AI Travel Planning Platform",
  description:
    "Scopri il tuo prossimo viaggio con Via Nexo. Piattaforma AI per pianificare viaggi personalizzati con hotel, ristoranti, tour e trasporti selezionati.",
  keywords: [
    "travel",
    "viaggio",
    "AI",
    "hotel",
    "ristoranti",
    "tour",
    "Italia",
    "pianificazione viaggi",
  ],
  authors: [{ name: "Via Nexo" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://vianexo.com",
    siteName: "Via Nexo",
    title: "Via Nexo - AI Travel Planning Platform",
    description:
      "Pianifica il tuo viaggio perfetto con l'intelligenza artificiale. Hotel di lusso, ristoranti stellati, tour esclusivi.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Via Nexo - AI Travel Planning",
    description: "Scopri il tuo prossimo viaggio con Via Nexo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" data-theme="dark">
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          jakarta.variable
        )}
      >
        <Header />
        <Suspense fallback={<div>Loading...</div>}>
          <main>{children}</main>
        </Suspense>
      </body>
    </html>
  );
}
