import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ricerca Viaggi - Via Nexo",
  description:
    "Esplora hotel di lusso, ristoranti stellati, tour esclusivi e servizi di trasporto selezionati per il tuo viaggio perfetto.",
  openGraph: {
    title: "Ricerca Viaggi - Via Nexo",
    description: "Trova hotel, ristoranti, tour e trasporti per il tuo viaggio",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
