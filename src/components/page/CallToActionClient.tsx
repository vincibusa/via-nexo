"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface CallToActionClientProps {
  initialUser: SupabaseUser | null;
}

export const CallToActionClient = ({
  initialUser,
}: CallToActionClientProps) => {
  const user = initialUser;

  return (
    <section className="container mx-auto w-full px-6 py-24">
      <div className="glass-light mx-auto max-w-4xl rounded-2xl border-neutral-700/50 p-12 text-center">
        <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
          Pronto per la Tua Prossima Avventura?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-300">
          Lascia che Via Nexo trasformi i tuoi sogni di viaggio in realtà.
          Inizia ora e scopri un modo completamente nuovo di viaggiare in
          Italia.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
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

        <div className="mt-8 border-t border-neutral-700 pt-8">
          <p className="mb-4 text-sm text-neutral-200">
            Unisciti a migliaia di viaggiatori che hanno già scoperto il futuro
            del turismo
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-neutral-300">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              Registrazione Gratuita
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              AI Personalizzata
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              Partner Verificati
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
