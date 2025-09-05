import Image from "next/image";
import { PartnerData } from "@/types";

interface PartnerCardProps {
  partner: PartnerData;
}

const PartnerTypeIcons = {
  hotel: "🏨",
  restaurant: "🍽️",
  tour: "🗺️",
  shuttle: "🚐",
} as const;

const PriceRangeLabels = {
  budget: "💰 Budget",
  "mid-range": "💰💰 Mid-range",
  luxury: "💰💰💰 Luxury",
  premium: "💰💰💰💰 Premium",
} as const;

export const PartnerCard = ({ partner }: PartnerCardProps) => {
  // Genera stelle per rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push("⭐");
    }
    if (hasHalfStar) {
      stars.push("⭐");
    }

    return stars.join("");
  };

  // Tronca descrizione se troppo lunga
  const truncateDescription = (desc: string, maxLength: number = 120) => {
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + "...";
  };

  // Immagine di fallback se manca
  const imageUrl =
    partner.images?.[0] ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945";

  return (
    <div className="max-w-sm overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800 transition-colors duration-200 hover:border-neutral-600">
      {/* Immagine */}
      <div className="relative h-48 w-full">
        <Image
          src={imageUrl}
          alt={partner.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Badge tipo partner */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-sm font-medium text-white">
          <span>{PartnerTypeIcons[partner.type]}</span>
          <span className="capitalize">{partner.type}</span>
        </div>
      </div>

      {/* Contenuto */}
      <div className="p-4">
        {/* Nome e Rating */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg leading-tight font-semibold text-white">
            {partner.name}
          </h3>
          <div className="flex items-center gap-1 text-sm">
            <span>{renderStars(partner.rating)}</span>
            <span className="text-neutral-400">({partner.rating})</span>
          </div>
        </div>

        {/* Location e Prezzo */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-neutral-300">
            <span>📍</span>
            <span>{partner.location}</span>
          </div>
          <div className="text-primary-400 text-xs font-medium">
            {PriceRangeLabels[
              partner.price_range as keyof typeof PriceRangeLabels
            ] || partner.price_range}
          </div>
        </div>

        {/* Descrizione */}
        <p className="mb-3 text-sm leading-relaxed text-neutral-400">
          {truncateDescription(partner.description)}
        </p>

        {/* Amenities/Features (prime 3) */}
        {partner.amenities && partner.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {partner.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="rounded-md bg-neutral-700 px-2 py-1 text-xs text-neutral-300"
              >
                {amenity}
              </span>
            ))}
            {partner.amenities.length > 3 && (
              <span className="px-2 py-1 text-xs text-neutral-500">
                +{partner.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Contatti (se disponibili) */}
        {partner.contact_info && (
          <div className="mt-3 flex items-center gap-3 border-t border-neutral-700 pt-3">
            {partner.contact_info.website && (
              <a
                href={partner.contact_info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm transition-colors"
              >
                🌐 Website
              </a>
            )}
            {partner.contact_info.phone && (
              <a
                href={`tel:${partner.contact_info.phone}`}
                className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm transition-colors"
              >
                📞 Call
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
