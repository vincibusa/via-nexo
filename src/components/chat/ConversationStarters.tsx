"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  MapPin,
  Calendar,
  Heart,
  Briefcase,
  Users,
  Mountain,
  Utensils,
} from "lucide-react";

interface ConversationStartersProps {
  onSelectStarter: (message: string) => void;
}

const conversationStarters = [
  {
    category: "Romantic Getaway",
    icon: Heart,
    color: "text-pink-400",
    bgColor: "bg-pink-900/20 border-pink-700/30",
    messages: [
      "Organizza un weekend romantico a Roma per due persone",
      "Pianifica una luna di miele di 7 giorni in Toscana",
      "Suggerisci un viaggio romantico a Venezia con cena in ristorante stellato",
    ],
  },
  {
    category: "Business Travel",
    icon: Briefcase,
    color: "text-blue-400",
    bgColor: "bg-blue-900/20 border-blue-700/30",
    messages: [
      "Hotel di lusso a Milano per viaggio d'affari di 3 giorni",
      "Organizza un soggiorno business a Roma con meeting room",
      "Ristoranti eleganti per cena di lavoro a Firenze",
    ],
  },
  {
    category: "Family Vacation",
    icon: Users,
    color: "text-green-400",
    bgColor: "bg-green-900/20 border-green-700/30",
    messages: [
      "Vacanza in famiglia in Sicilia per 10 giorni con bambini",
      "Tour della Costiera Amalfitana adatto a famiglie",
      "Attività per bambini e adulti a Napoli per 5 giorni",
    ],
  },
  {
    category: "Adventure & Nature",
    icon: Mountain,
    color: "text-orange-400",
    bgColor: "bg-orange-900/20 border-orange-700/30",
    messages: [
      "Tour avventura nelle Dolomiti con trekking e natura",
      "Esperienze outdoor in Umbria per 4 giorni",
      "Vacanza attiva in Alto Adige con mountain bike e hiking",
    ],
  },
  {
    category: "Food & Wine",
    icon: Utensils,
    color: "text-purple-400",
    bgColor: "bg-purple-900/20 border-purple-700/30",
    messages: [
      "Tour enogastronomico in Piemonte con degustazioni",
      "Ristoranti stellati Michelin in Emilia-Romagna",
      "Esperienza culinaria autentica in Campania",
    ],
  },
  {
    category: "City Break",
    icon: MapPin,
    color: "text-cyan-400",
    bgColor: "bg-cyan-900/20 border-cyan-700/30",
    messages: [
      "Weekend lungo a Firenze con arte e cultura",
      "3 giorni a Bologna tra storia e gastronomia",
      "City break a Torino con musei e cioccolaterie",
    ],
  },
];

export const ConversationStarters: React.FC<ConversationStartersProps> = ({
  onSelectStarter,
}) => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Sparkles className="text-primary-400 h-6 w-6" />
          <h3 className="text-2xl font-bold text-white">
            Inizia la tua avventura
          </h3>
        </div>
        <p className="text-lg text-neutral-400">
          Seleziona un tema o descrivi il tuo viaggio ideale
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conversationStarters.map((starter, categoryIndex) => (
          <Card
            key={starter.category}
            className={`cursor-pointer border p-4 transition-all duration-300 hover:scale-105 ${starter.bgColor} hover:bg-opacity-30`}
          >
            <div className="mb-3 flex items-center gap-3">
              <starter.icon className={`h-5 w-5 ${starter.color}`} />
              <h4 className="text-sm font-semibold text-white">
                {starter.category}
              </h4>
            </div>

            <div className="space-y-2">
              {starter.messages.map((message, messageIndex) => (
                <Button
                  key={`${categoryIndex}-${messageIndex}`}
                  variant="ghost"
                  className="h-auto min-h-[44px] w-full justify-start px-3 py-3 text-left text-xs text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                  onClick={() => onSelectStarter(message)}
                >
                  <div className="truncate">{message}</div>
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800/30 px-4 py-2 text-sm text-neutral-400">
          <Calendar className="h-4 w-4" />
          <span>
            Oppure descrivi liberamente il tuo viaggio ideale nel box qui sotto
          </span>
        </div>
      </div>
    </div>
  );
};
