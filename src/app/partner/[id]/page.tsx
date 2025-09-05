"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MapPin, Star, Phone, Mail, Globe } from "lucide-react";
import { PartnerData } from "@/types";

const PartnerTypeIcons = {
  hotel: "🏨",
  restaurant: "🍽️",
  tour: "🗺️",
  shuttle: "🚐",
} as const;

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const partnerId = params.id as string;

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await fetch(`/api/partners/${partnerId}`);
        if (!response.ok) {
          throw new Error("Partner not found");
        }
        const data = await response.json();
        setPartner(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load partner");
      } finally {
        setLoading(false);
      }
    };

    if (partnerId) {
      fetchPartner();
    }
  }, [partnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="mb-6 h-8 w-48 rounded bg-neutral-700"></div>
            <div className="mb-8 h-64 rounded bg-neutral-700"></div>
            <div className="space-y-4">
              <div className="h-4 w-3/4 rounded bg-neutral-700"></div>
              <div className="h-4 w-1/2 rounded bg-neutral-700"></div>
              <div className="h-4 w-2/3 rounded bg-neutral-700"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Partner non trovato</h1>
          <p className="mb-6 text-neutral-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-6 py-3 transition-colors"
          >
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="h-5 w-5 fill-yellow-400/50 text-yellow-400"
        />
      );
    }
    // Aggiungi stelle vuote
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-5 w-5 text-neutral-600" />);
    }

    return stars;
  };

  const mainImage =
    partner.images?.[0] ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header con back button */}
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Torna indietro
        </button>
      </div>

      {/* Immagine principale */}
      <div className="relative mb-8 h-96 w-full">
        <Image
          src={mainImage}
          alt={partner.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Badge tipo partner */}
        <div className="absolute top-6 left-6 flex items-center gap-2 rounded-lg bg-black/70 px-4 py-2 text-lg font-medium">
          <span className="text-2xl">{PartnerTypeIcons[partner.type]}</span>
          <span className="capitalize">{partner.type}</span>
        </div>

        {/* Titolo e rating sovrapposti */}
        <div className="absolute right-6 bottom-6 left-6">
          <h1 className="mb-2 text-4xl font-bold">{partner.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {renderStars(partner.rating)}
              <span className="ml-2 text-lg font-medium">
                ({partner.rating})
              </span>
            </div>
            <div className="flex items-center gap-1 text-neutral-300">
              <MapPin className="h-5 w-5" />
              <span>{partner.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto principale */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Colonna principale */}
          <div className="lg:col-span-2">
            {/* Descrizione */}
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Descrizione</h2>
              <p className="leading-relaxed text-neutral-300">
                {partner.description}
              </p>
            </section>

            {/* Servizi/Amenities */}
            {partner.amenities && partner.amenities.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-bold">
                  {partner.type === "hotel"
                    ? "Servizi"
                    : partner.type === "restaurant"
                      ? "Specialità"
                      : partner.type === "tour"
                        ? "Incluso"
                        : "Caratteristiche"}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {partner.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 p-3"
                    >
                      <div className="bg-primary-500 h-2 w-2 rounded-full" />
                      <span className="text-neutral-200">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Galleria immagini */}
            {partner.images && partner.images.length > 1 && (
              <section className="mb-8">
                <h2 className="mb-4 text-2xl font-bold">Galleria</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {partner.images.slice(1).map((image, index) => (
                    <div
                      key={index}
                      className="relative h-32 overflow-hidden rounded-lg"
                    >
                      <Image
                        src={image}
                        alt={`${partner.name} - Image ${index + 2}`}
                        fill
                        className="object-cover transition-transform duration-200 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar informazioni */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Prezzo */}
              <div className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-6">
                <h3 className="mb-2 text-lg font-bold">Fascia di prezzo</h3>
                <div className="text-primary-400 text-xl font-medium">
                  {partner.price_range === "budget"
                    ? "💰 Budget"
                    : partner.price_range === "mid-range"
                      ? "💰💰 Mid-range"
                      : partner.price_range === "luxury"
                        ? "💰💰💰 Luxury"
                        : partner.price_range === "premium"
                          ? "💰💰💰💰 Premium"
                          : partner.price_range}
                </div>
              </div>

              {/* Contatti */}
              {partner.contact_info && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-6">
                  <h3 className="mb-4 text-lg font-bold">Contatti</h3>
                  <div className="space-y-3">
                    {partner.contact_info.phone && (
                      <a
                        href={`tel:${partner.contact_info.phone}`}
                        className="flex items-center gap-3 rounded-lg bg-neutral-700 p-3 transition-colors hover:bg-neutral-600"
                      >
                        <Phone className="text-primary-400 h-5 w-5" />
                        <span>{partner.contact_info.phone}</span>
                      </a>
                    )}
                    {partner.contact_info.email && (
                      <a
                        href={`mailto:${partner.contact_info.email}`}
                        className="flex items-center gap-3 rounded-lg bg-neutral-700 p-3 transition-colors hover:bg-neutral-600"
                      >
                        <Mail className="text-primary-400 h-5 w-5" />
                        <span>{partner.contact_info.email}</span>
                      </a>
                    )}
                    {partner.contact_info.website && (
                      <a
                        href={partner.contact_info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg bg-neutral-700 p-3 transition-colors hover:bg-neutral-600"
                      >
                        <Globe className="text-primary-400 h-5 w-5" />
                        <span>Sito web</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
