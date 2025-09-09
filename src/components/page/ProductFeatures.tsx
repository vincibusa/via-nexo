"use client";

import { Brain, Shield, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Search",
    description:
      "Descrivi il tuo viaggio in linguaggio naturale. La nostra AI comprende le tue preferenze e trova i partner perfetti per te.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Partner Verificati",
    description:
      "Hotel di lusso, ristoranti stellati, tour esclusivi e servizi navetta selezionati e verificati in tutta Italia.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: Sparkles,
    title: "Esperienza Personalizzata",
    description:
      "Ogni raccomandazione è su misura per te: budget, stile di viaggio, occasione e preferenze personali.",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
];

export const ProductFeatures = () => {
  return (
    <section className="container mx-auto w-full px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Perché Scegliere Via Nexo
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-neutral-300">
          L&apos;intelligenza artificiale incontra l&apos;ospitalità italiana
          per offrirti un&apos;esperienza di viaggio senza paragoni.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="glass-light group border-neutral-700/50 p-8 text-center transition-all duration-300 hover:scale-105"
          >
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6 transition-transform duration-300 group-hover:scale-110`}
            >
              <feature.icon className={`h-8 w-8 ${feature.color}`} />
            </div>

            <h3 className="mb-4 text-xl font-semibold text-white">
              {feature.title}
            </h3>

            <p className="leading-relaxed text-neutral-300">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
};
