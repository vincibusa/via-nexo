"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export const Hero = () => {
  const { user } = useAuth();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-16 text-center md:pt-40 md:pb-24">
      <h1 className="mb-6 text-4xl font-extrabold text-white md:text-6xl">
        Il Futuro del Turismo
        <span className="text-primary-400 mt-2 block">È Qui</span>
      </h1>

      <div className="max-w-3xl">
        <p className="mb-8 text-xl leading-relaxed text-neutral-300">
          Via Nexo rivoluziona il modo di viaggiare in Italia. Descrivi i tuoi
          sogni in linguaggio naturale e lascia che la nostra
          <span className="text-primary-400 font-semibold">
            {" "}
            intelligenza artificiale{" "}
          </span>
          trovi i partner perfetti per te.
        </p>

        <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm text-neutral-200">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            Hotel di Lusso
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            Ristoranti Stellati
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
            Tour Esclusivi
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            Servizi Navetta
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        {user ? (
          <>
            <Button
              asChild
              size="lg"
              className="bg-primary-500 hover:bg-primary-600 group focus:ring-primary-300 min-h-[48px] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              <Link href="/chat" className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Inizia Chat AI
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="group focus:ring-primary-400 min-h-[48px] border-2 border-neutral-400 bg-neutral-800/50 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-neutral-300 hover:bg-neutral-700/70 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              <Link href="/search" className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Esplora Viaggi
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button
              asChild
              size="lg"
              className="bg-primary-500 hover:bg-primary-600 group focus:ring-primary-300 min-h-[48px] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              <Link href="/register" className="flex items-center gap-2">
                Inizia Gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="group focus:ring-primary-400 min-h-[48px] border-2 border-neutral-400 bg-neutral-800/50 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:border-neutral-300 hover:bg-neutral-700/70 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              <Link href="/search" className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Esplora Senza Registrarti
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        onClick={scrollToFeatures}
        className="hover:text-primary-300 group focus:ring-primary-400 min-h-[44px] rounded-lg px-4 py-2 text-neutral-200 transition-colors duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900"
      >
        <span>Scopri come funziona</span>
        <ArrowRight className="ml-2 h-4 w-4 rotate-90 transition-transform group-hover:translate-y-1" />
      </Button>
    </div>
  );
};
