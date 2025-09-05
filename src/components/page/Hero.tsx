// src/components/page/Hero.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSearchIcon, SearchIcon } from "./Icons";
import { useAutoResize } from "@/hooks/useAutoResize";

export const Hero = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea, allowing more expansion for detailed travel descriptions
  useAutoResize(textareaRef, query, 1, 3);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/chat?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter = search (like the original behavior)
    // Shift+Enter = new line for longer descriptions
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-16 text-center md:pt-40 md:pb-24">
      <h2 className="text-4xl font-extrabold text-white md:text-6xl">
        Find Your Next Adventure
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-neutral-300">
        Descrivi il tuo viaggio ideale in dettaglio, e lascia che la nostra AI
        crei un itinerario personalizzato solo per te. Più dettagli fornisci,
        migliori saranno i suggerimenti!
      </p>
      <div className="mt-10 w-full max-w-2xl">
        <div className="glass-light p-2">
          <div className="relative flex w-full flex-col gap-4 md:flex-row">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-4">
                <SearchIcon className="mt-0.5 text-neutral-400" />
              </div>
              <Textarea
                ref={textareaRef}
                className="focus:ring-primary-500/50 min-h-[2.75rem] w-full resize-none rounded-lg border-none bg-transparent py-3 pr-4 pl-12 text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:outline-none"
                placeholder="Descrivi il tuo viaggio ideale... Es: 'Vorrei una luna di miele romantica a Roma per 4 giorni a novembre, con hotel di lusso e ristoranti stellati' (Shift+Enter per andare a capo)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
            </div>
            <Button
              className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500/50 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-colors duration-300 ease-in-out focus:ring-2 focus:outline-none"
              onClick={handleSearch}
            >
              <AiSearchIcon />
              <span>AI Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
