import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat - Via Nexo",
  description:
    "Chatta con la nostra AI per pianificare il tuo viaggio ideale. Descrivi le tue preferenze e ricevi suggerimenti personalizzati.",
  openGraph: {
    title: "AI Chat - Via Nexo",
    description: "Pianifica il tuo viaggio con l'assistente AI di Via Nexo",
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
