"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const destinations = [
  {
    name: "Rome",
    country: "Italy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDs62ZROx-Q_6tFC9-6_HSRhsSvd4No4nItWqeooVj1lCYMjWXhmPyWTObx8sHR0sf0GBt_kqvsXYZZRztJqYk3eqtZLnThO_q-OE6uGh1eNS5qGfOGYum5ZpinbhtLhFZFVHUVgPNKxki4gxF2jchf8G4CUIUSh4W8BtjKloQ9xClx6D_XkCELy_c5wgY7s4dTPQ077iLcIpWnmLJ-utvLOU_Db6CTC4u-y9MHIfBKQCrV5XnuN4zU5qh8zvkOC7gOxuQOpSr7GeAa",
  },
  {
    name: "Florence",
    country: "Italy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkesGRKmtc5ssl32CXSRLZD-SLaAqmwI08WKpcGhmwpyG4nZpYWfm5StQNBH-yoMj3XOyFbY6YKFj95zmlBfIT1GUazryt6jLVOYzQw4jQbuQZwxo_emoR_o3myjS-IZXw2I1CPllUtopdIoOp9jkeRSDDdTqR-RE3qomPDOTmkGtkarX99rg7envSW4TwYcQp0mf-giBo-0TeeWFS_Xs8q8dV3qmnkSskNlQyeTylVi9MJqkMZzI_7LMbiDssFtaRhpgOxscej-mq",
  },
  {
    name: "Venice",
    country: "Italy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDWa-yXB4BpDriKe74-8ghHjz0SN572ki6VJno1Ct9VxXM1jjZGhuiiRc2C3HicsjQdWaHf75PQ1N6aSaDIJ77oEt9camhtuOFaPckdOZRLEsoGhlOFaHae2RNlSyT66M6FhSzNAE6FY7YG0sLiNaWqlSIhEuWALJc_EOZFC8E4XRmyYDo5D1Nape4s1YgYM-J8ylbveEeAS2E_CxDAnO42uGBspJgXm8zkEj-ksApLqM9nGdnrkpHHVRK3gwyC1stuBIzz0FpILHwx",
  },
  {
    name: "Milan",
    country: "Italy",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnxgoWP5WCelln5torR11y1NCIGJVdj5kSc8SUbZN-j7NSK9pU7YxE4VrCWY-yOpPSb3_YH0MldOi-zdtjtzOd8N4Ab4al5A8ciVnBf9LYOBmUHEoI3Np4UalSUXIe6kFPnKcd3bGZ4SkcEu3zMU8qQFP8BgUQmi53meuyf722eJVR-xs9q0wqSEz8vTqg9YNThufIZFAIMIXJzso1qfJYMm-Xh0fv37fFW35lEEK9W1OXkyF5IP_pKkEY-sg2LZZFKYFtrs-uim19",
  },
];

export const PopularDestinations = () => {
  const router = useRouter();

  const handleDestinationClick = (destination: string) => {
    router.push(`/search?destination=${encodeURIComponent(destination)}`);
  };

  return (
    <section className="container mx-auto w-full px-6 pb-24">
      <div className="mb-12 flex flex-col items-center">
        <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Destinazioni Popolari
        </h3>
        <p className="max-w-2xl text-center text-lg text-neutral-300">
          Scopri le mete più amate dai nostri viaggiatori. Ogni destinazione
          offre esperienze uniche con partner selezionati e verificati.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map(dest => (
          <Card
            key={dest.name}
            className="group relative h-80 cursor-pointer overflow-hidden rounded-2xl border-none transition-transform duration-300 hover:scale-105"
            onClick={() => handleDestinationClick(dest.name)}
          >
            <Image
              alt={dest.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              src={dest.image}
              layout="fill"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <h4 className="text-xl font-bold text-white">{dest.name}</h4>
              <p className="text-sm text-neutral-300">{dest.country}</p>
            </div>
            <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="group focus:ring-primary-400 min-h-[48px] border-2 border-neutral-400 bg-neutral-800/50 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-neutral-300 hover:bg-neutral-700/70 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          <Link href="/search" className="flex items-center gap-2">
            Scopri Tutte le Destinazioni
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
