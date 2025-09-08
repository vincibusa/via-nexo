import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Details - Via Nexo",
  description:
    "Scopri i dettagli completi del partner selezionato. Informazioni, servizi, contatti e tutto quello che serve per il tuo viaggio.",
  openGraph: {
    title: "Partner Details - Via Nexo",
    description: "Dettagli completi del partner di viaggio selezionato",
  },
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
