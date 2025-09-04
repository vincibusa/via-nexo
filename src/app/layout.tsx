import type { Metadata } from "next";
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
  title: "TravelApp - Esplora e Scopri",
  description: "Find Your Next Adventure",
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
        <main>{children}</main>
      </body>
    </html>
  );
}
