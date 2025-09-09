"use client";

import { MessageCircle, Search, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Descrivi il Tuo Viaggio",
    description:
      "Racconta in linguaggio naturale cosa desideri: &lsquo;Un weekend romantico a Roma con ristorante stellato&rsquo; o &lsquo;Vacanza famiglia a Sicilia, 7 giorni, budget medio&rsquo;.",
    color: "text-primary-400",
    bgColor: "bg-primary-500/10",
  },
  {
    number: "02",
    icon: Search,
    title: "L&apos;AI Trova i Partner",
    description:
      "La nostra intelligenza artificiale analizza le tue preferenze e seleziona automaticamente hotel, ristoranti, tour e trasporti che si adattano perfettamente ai tuoi desideri.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    number: "03",
    icon: MapPin,
    title: "Prenota e Parti",
    description:
      "Ricevi raccomandazioni personalizzate con tutti i dettagli necessari. Confronta le opzioni, leggi le recensioni e prenota direttamente con i nostri partner certificati.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export const HowItWorks = () => {
  return (
    <section className="container mx-auto w-full bg-neutral-900/50 px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Come Funziona Via Nexo
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-neutral-300">
          Tre semplici passaggi per trasformare i tuoi sogni di viaggio in
          realtà, con l&apos;aiuto della nostra intelligenza artificiale.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <Card className="glass-light group h-full border-neutral-700/50 p-8 text-center transition-all duration-300 hover:scale-105">
              {/* Step Number */}
              <div className="absolute -top-4 left-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-neutral-600 bg-neutral-800">
                  <span className="text-primary-400 text-lg font-bold">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Icon */}
              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${step.bgColor} mt-4 mb-6 transition-transform duration-300 group-hover:scale-110`}
              >
                <step.icon className={`h-8 w-8 ${step.color}`} />
              </div>

              {/* Content */}
              <h3 className="mb-4 text-xl font-semibold text-white">
                {step.title}
              </h3>

              <p className="leading-relaxed text-neutral-300">
                {step.description}
              </p>
            </Card>

            {/* Connection Line (for desktop) */}
            {index < steps.length - 1 && (
              <div className="absolute top-1/2 -right-4 z-10 hidden h-px w-8 -translate-y-1/2 transform bg-gradient-to-r from-neutral-600 to-transparent lg:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
