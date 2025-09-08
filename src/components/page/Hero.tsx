// src/components/page/Hero.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSearchIcon, SearchIcon } from "./Icons";
import { useAutoResize } from "@/hooks/useAutoResize";
import { TraditionalSearch } from "./TraditionalSearch";

export const Hero = () => {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"ai" | "traditional">("ai");
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
      <div className="mt-4 max-w-2xl">
        <p className="text-lg text-neutral-300">
          {searchType === "ai"
            ? "Descrivi il tuo viaggio ideale in linguaggio naturale, e lascia che la nostra AI crei un itinerario personalizzato."
            : "Usa i filtri per trovare rapidamente il viaggio perfetto. Seleziona destinazione, durata e preferenze."}
        </p>
        {searchType === "ai" && (
          <div className="mt-3 rounded-lg bg-neutral-800/30 p-3">
            <p className="mb-2 text-sm text-neutral-400">Esempi di ricerca:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Un weekend romantico a Roma",
                "Vacanza in famiglia a Sicilia 7 giorni",
                "Viaggio d'affari a Milano con hotel 5 stelle",
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="rounded-full bg-neutral-700/50 px-3 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-600/50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="glass-light rounded-xl p-2 shadow-lg">
          <div className="flex gap-2 rounded-lg bg-neutral-800/40 p-1">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="ai"
                checked={searchType === "ai"}
                onChange={() => setSearchType("ai")}
                className="sr-only"
              />
              <div
                className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  searchType === "ai"
                    ? "bg-primary-500 scale-105 transform text-white shadow-lg"
                    : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
                }`}
              >
                <AiSearchIcon width={16} height={16} />
                <div className="text-center">
                  <div className="font-semibold">AI Search</div>
                  <div className="text-xs opacity-80">Linguaggio naturale</div>
                </div>
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="searchType"
                value="traditional"
                checked={searchType === "traditional"}
                onChange={() => setSearchType("traditional")}
                className="sr-only"
              />
              <div
                className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  searchType === "traditional"
                    ? "bg-primary-500 scale-105 transform text-white shadow-lg"
                    : "text-neutral-300 hover:bg-neutral-700/50 hover:text-white"
                }`}
              >
                <SearchIcon width={16} height={16} />
                <div className="text-center">
                  <div className="font-semibold">Ricerca Filtri</div>
                  <div className="text-xs opacity-80">Selezione guidata</div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        {searchType === "ai" ? (
          <div className="glass-light p-2">
            <div className="relative flex w-full flex-col items-center justify-center gap-4 md:flex-row">
              <div className="relative flex-grow">
                <div className="pointer-events-none absolute top-3 left-0 flex items-start pl-4">
                  <SearchIcon className="mt-0.5 text-neutral-400" />
                </div>
                <Textarea
                  ref={textareaRef}
                  className="focus:ring-primary-500/50 min-h-[2.75rem] w-full resize-none rounded-lg border-none bg-transparent py-3 pr-4 pl-12 text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:outline-none"
                  placeholder="Descrivi il tuo viaggio perfetto..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
              </div>
              <Button
                className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500/50 flex w-full items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-colors duration-300 ease-in-out focus:ring-2 focus:outline-none md:w-auto"
                onClick={handleSearch}
              >
                <AiSearchIcon />
                <span>AI Search</span>
              </Button>
            </div>
          </div>
        ) : (
          <TraditionalSearch />
        )}
      </div>
    </div>
  );
};
