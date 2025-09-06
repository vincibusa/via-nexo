"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "./Icons";

export const TraditionalSearch = () => {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [travelType, setTravelType] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (!destination.trim()) return;

    const params = new URLSearchParams();
    params.set("destination", destination.trim());
    if (duration) params.set("duration", duration);
    if (budget) params.set("budget", budget);
    if (travelType) params.set("type", travelType);

    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="glass-light p-4">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative w-full">
          <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-3">
            <SearchIcon className="text-neutral-400" width={18} height={18} />
          </div>

          <Input
            placeholder="Dove vuoi andare?"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            onKeyDown={handleKeyDown}
            className="focus:border-primary-500 w-full border-neutral-600 bg-neutral-800/50 pl-10 text-neutral-100 placeholder-neutral-400"
          />
        </div>

        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger className="w-full border-neutral-600 bg-neutral-800/50 text-neutral-100">
            <SelectValue placeholder="Durata" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-3">1-3 giorni</SelectItem>
            <SelectItem value="4-7">4-7 giorni</SelectItem>
            <SelectItem value="8-14">1-2 settimane</SelectItem>
            <SelectItem value="15+">Più di 2 settimane</SelectItem>
          </SelectContent>
        </Select>

        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger className="w-full border-neutral-600 bg-neutral-800/50 text-neutral-100">
            <SelectValue placeholder="Budget" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">€ Economico</SelectItem>
            <SelectItem value="mid">€€ Medio</SelectItem>
            <SelectItem value="high">€€€ Alto</SelectItem>
            <SelectItem value="luxury">€€€€ Lusso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={travelType} onValueChange={setTravelType}>
          <SelectTrigger className="w-full border-neutral-600 bg-neutral-800/50 text-neutral-100">
            <SelectValue placeholder="Tipo viaggio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="romantic">Romantico</SelectItem>
            <SelectItem value="family">Famiglia</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="adventure">Avventura</SelectItem>
            <SelectItem value="culture">Culturale</SelectItem>
            <SelectItem value="relaxation">Relax</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500/50 flex w-full items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-colors duration-300 ease-in-out focus:ring-2 focus:outline-none"
        onClick={handleSearch}
        disabled={!destination.trim()}
      >
        <SearchIcon width={18} height={18} />
        <span>Cerca Viaggi</span>
      </Button>
    </div>
  );
};
