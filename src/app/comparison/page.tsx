"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NavigationBreadcrumb } from "@/components/page/NavigationBreadcrumb";
import { ComparisonButton } from "@/components/partner/ComparisonButton";
import {
  ArrowLeft,
  Scale,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
} from "lucide-react";
import type { PartnerData } from "@/types";
import Image from "next/image";

function ComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const partnerIds =
      searchParams.get("items")?.split(",").filter(Boolean) || [];
    const fetchPartners = async () => {
      if (partnerIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const partnerPromises = partnerIds.map(async id => {
          const response = await fetch(`/api/partners/${id}`);
          if (response.ok) {
            return response.json();
          }
          return null;
        });

        const results = await Promise.all(partnerPromises);
        const validPartners = results.filter(Boolean);
        setPartners(validPartners);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load partners"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [searchParams]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="h-4 w-4 fill-yellow-400/50 text-yellow-400"
        />
      );
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-neutral-600" />);
    }

    return stars;
  };

  const getPriceDisplay = (priceRange: string) => {
    switch (priceRange) {
      case "budget":
        return "€ - €€";
      case "mid-range":
        return "€€ - €€€";
      case "luxury":
        return "€€€ - €€€€";
      case "premium":
        return "€€€€ - €€€€€";
      default:
        return priceRange;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-neutral-700"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded bg-neutral-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="py-16 text-center">
            <h1 className="mb-2 text-2xl font-bold">Errore</h1>
            <p className="mb-6 text-neutral-400">{error}</p>
            <Button
              onClick={() => router.push("/search")}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Torna alla ricerca
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavigationBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="py-16 text-center">
            <Scale className="mx-auto mb-4 h-16 w-16 text-neutral-500" />
            <h1 className="mb-2 text-2xl font-bold">
              Nessun elemento da confrontare
            </h1>
            <p className="mb-6 text-neutral-400">
              Aggiungi dei partner alla tua lista per confrontarli qui.
            </p>
            <Button
              onClick={() => router.push("/search")}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Vai alla ricerca
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <NavigationBreadcrumb />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Torna indietro
          </Button>

          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Scale className="text-primary-500 h-8 w-8" />
              Confronta Partner
            </h1>
            <p className="mt-1 text-neutral-400">
              Confronta {partners.length}{" "}
              {partners.length === 1 ? "partner" : "partner"} selezionati
            </p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {partners.map(partner => (
            <Card
              key={partner.id}
              className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm"
            >
              {/* Partner Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={
                    partner.images?.[0] ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                  }
                  alt={partner.name}
                  fill
                  className="rounded-t-lg object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    {partner.type === "hotel" && "🏨 Hotel"}
                    {partner.type === "restaurant" && "🍽️ Ristorante"}
                    {partner.type === "tour" && "🗺️ Tour"}
                    {partner.type === "shuttle" && "🚐 Trasporto"}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <ComparisonButton partnerId={partner.id} variant="icon" />
                </div>
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg">
                  {partner.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(partner.rating)}
                    <span className="ml-1 text-sm text-neutral-400">
                      ({partner.rating})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-neutral-400">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{partner.location}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price */}
                <div className="rounded-lg bg-neutral-700/50 p-3 text-center">
                  <div className="text-primary-400 text-lg font-semibold">
                    {getPriceDisplay(partner.price_range)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {partner.type === "hotel" && "per notte"}
                    {partner.type === "restaurant" && "fascia prezzo"}
                    {partner.type === "tour" && "per persona"}
                    {partner.type === "shuttle" && "per tratta"}
                  </div>
                </div>

                {/* Description */}
                <p className="line-clamp-3 text-sm text-neutral-300">
                  {partner.description}
                </p>

                {/* Amenities/Features */}
                {partner.amenities && partner.amenities.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-neutral-200">
                      {partner.type === "hotel"
                        ? "Servizi"
                        : partner.type === "restaurant"
                          ? "Specialità"
                          : partner.type === "tour"
                            ? "Incluso"
                            : "Caratteristiche"}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {partner.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-neutral-600 text-xs text-neutral-400"
                        >
                          {amenity}
                        </Badge>
                      ))}
                      {partner.amenities.length > 3 && (
                        <Badge
                          variant="outline"
                          className="border-neutral-600 text-xs text-neutral-400"
                        >
                          +{partner.amenities.length - 3} altri
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Separator className="bg-neutral-600" />

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push(`/partner/${partner.id}`)}
                    className="bg-primary-600 hover:bg-primary-700 w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Vedi dettagli
                  </Button>

                  <div className="grid grid-cols-3 gap-1">
                    {partner.contact_info?.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          window.open(`tel:${partner.contact_info?.phone}`)
                        }
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    {partner.contact_info?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          window.open(`mailto:${partner.contact_info?.email}`)
                        }
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                    {partner.contact_info?.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          window.open(partner.contact_info?.website, "_blank")
                        }
                      >
                        <Globe className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/search")}
            className="border-neutral-600 bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
          >
            Aggiungi altri partner al confronto
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white">
          <div className="flex h-screen items-center justify-center">
            <div className="text-white">Caricamento confronto...</div>
          </div>
        </div>
      }
    >
      <ComparisonContent />
    </Suspense>
  );
}
