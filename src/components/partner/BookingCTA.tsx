"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Users,
  Heart,
  ExternalLink,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PartnerData } from "@/types";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useFavorites } from "@/hooks/useFavorites";
import { ComparisonButton } from "./ComparisonButton";

interface BookingCTAProps {
  partner: PartnerData;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({ partner }) => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(partner.id);

  const getBookingLabels = () => {
    switch (partner.type) {
      case "hotel":
        return {
          primary: "Prenota Camera",
          dateLabel: "Check-in / Check-out",
          guestLabel: "Ospiti",
          contactLabel: "Contatta Hotel",
        };
      case "restaurant":
        return {
          primary: "Prenota Tavolo",
          dateLabel: "Data prenotazione",
          guestLabel: "Commensali",
          contactLabel: "Contatta Ristorante",
        };
      case "tour":
        return {
          primary: "Prenota Tour",
          dateLabel: "Data tour",
          guestLabel: "Partecipanti",
          contactLabel: "Contatta Tour Operator",
        };
      case "shuttle":
        return {
          primary: "Prenota Trasporto",
          dateLabel: "Data trasporto",
          guestLabel: "Passeggeri",
          contactLabel: "Contatta Servizio",
        };
      default:
        return {
          primary: "Prenota",
          dateLabel: "Data",
          guestLabel: "Persone",
          contactLabel: "Contatta",
        };
    }
  };

  const labels = getBookingLabels();

  const handleBookingClick = () => {
    const bookingData = {
      partnerId: partner.id,
      partnerName: partner.name,
      partnerType: partner.type,
      checkIn: checkIn?.toISOString(),
      checkOut: checkOut?.toISOString(),
      guests: parseInt(guests),
      timestamp: new Date().toISOString(),
    };

    // Store booking attempt for analytics
    console.log("Booking attempt:", bookingData);

    // If partner has booking URL, open it
    if (partner.contact_info?.website) {
      window.open(partner.contact_info.website, "_blank");
    } else {
      // Otherwise, show contact options
      alert(
        `Contatta direttamente ${partner.name} per prenotare:\n${partner.contact_info?.phone || "Telefono non disponibile"}`
      );
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(partner.id);
  };

  const isHotel = partner.type === "hotel";

  return (
    <Card className="sticky top-6 border-neutral-700 bg-neutral-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
            {partner.type === "hotel" && "🏨"}
            {partner.type === "restaurant" && "🍽️"}
            {partner.type === "tour" && "🗺️"}
            {partner.type === "shuttle" && "🚐"}
            Prenotazione
          </CardTitle>

          <div className="flex items-center gap-1">
            <ComparisonButton partnerId={partner.id} variant="icon" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavoriteToggle}
              className="h-11 w-11 hover:bg-neutral-700"
              aria-label={
                isFavorited ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
              aria-pressed={isFavorited}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorited ? "fill-red-500 text-red-500" : "text-neutral-400"
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="rounded-lg bg-neutral-700/50 p-4 text-center">
          <div className="text-primary-400 mb-1 text-2xl font-bold">
            {partner.price_range === "budget" && "€ - €€"}
            {partner.price_range === "mid-range" && "€€ - €€€"}
            {partner.price_range === "luxury" && "€€€ - €€€€"}
            {partner.price_range === "premium" && "€€€€ - €€€€€"}
            {(!partner.price_range ||
              !["budget", "mid-range", "luxury", "premium"].includes(
                partner.price_range
              )) &&
              partner.price_range}
          </div>
          <p className="text-sm text-neutral-400">
            {partner.type === "hotel" && "per notte"}
            {partner.type === "restaurant" && "fascia di prezzo"}
            {partner.type === "tour" && "per persona"}
            {partner.type === "shuttle" && "per tratta"}
          </p>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-neutral-200">
            {labels.dateLabel}
          </Label>

          <div
            className={cn(
              "grid gap-2",
              isHotel ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {/* Check-in / Main Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start border-neutral-600 bg-neutral-700 text-left font-normal text-neutral-200 hover:bg-neutral-600",
                    !checkIn && "text-neutral-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? (
                    format(checkIn, "dd MMM yyyy", { locale: it })
                  ) : (
                    <span>{isHotel ? "Check-in" : "Seleziona data"}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto border-neutral-600 bg-neutral-800 p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={date => date < new Date()}
                  initialFocus
                  className="bg-neutral-800 text-neutral-200"
                />
              </PopoverContent>
            </Popover>

            {/* Check-out (only for hotels) */}
            {isHotel && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start border-neutral-600 bg-neutral-700 text-left font-normal text-neutral-200 hover:bg-neutral-600",
                      !checkOut && "text-neutral-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? (
                      format(checkOut, "dd MMM yyyy", { locale: it })
                    ) : (
                      <span>Check-out</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto border-neutral-600 bg-neutral-800 p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={date => date <= (checkIn || new Date())}
                    initialFocus
                    className="bg-neutral-800 text-neutral-200"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Guest Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-neutral-200">
            {labels.guestLabel}
          </Label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger className="border-neutral-600 bg-neutral-700 text-neutral-200">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="border-neutral-600 bg-neutral-800">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <SelectItem
                  key={num}
                  value={num.toString()}
                  className="text-neutral-200"
                >
                  {num} {num === 1 ? "persona" : "persone"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-neutral-600" />

        {/* Primary Booking Button */}
        <Button
          onClick={handleBookingClick}
          className="bg-primary-600 hover:bg-primary-700 h-auto w-full py-3 font-semibold text-white"
          size="lg"
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          {labels.primary}
        </Button>

        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-2">
          {partner.contact_info?.phone && (
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              onClick={() => window.open(`tel:${partner.contact_info?.phone}`)}
            >
              <Phone className="mr-1 h-4 w-4" />
              Chiama
            </Button>
          )}

          {partner.contact_info?.email && (
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-600 bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              onClick={() =>
                window.open(`mailto:${partner.contact_info?.email}`)
              }
            >
              <Mail className="mr-1 h-4 w-4" />
              Email
            </Button>
          )}
        </div>

        {/* Chat with AI about this partner */}
        <Button
          variant="outline"
          size="sm"
          className="w-full border-neutral-600 bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
          onClick={() => {
            const chatUrl = `/chat?query=${encodeURIComponent(`Dimmi di più su ${partner.name} - ${partner.type} a ${partner.location}`)}`;
            window.open(chatUrl, "_blank");
          }}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chiedi info all&apos;AI
        </Button>

        {/* Trust signals */}
        <div className="pt-2 text-center">
          <div className="mb-1 flex items-center justify-center gap-1 text-xs text-neutral-400">
            <div className="h-1 w-1 rounded-full bg-green-400"></div>
            <span>Prenotazione sicura</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-neutral-400">
            <div className="h-1 w-1 rounded-full bg-blue-400"></div>
            <span>Partner verificato Via Nexo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
