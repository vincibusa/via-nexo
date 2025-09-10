import Image from "next/image";
import { useRouter } from "next/navigation";
import { PartnerData } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectablePartnerCardProps {
  partner: PartnerData;
  isSelected: boolean;
  onToggleSelection: () => void;
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

export const SelectablePartnerCard = ({
  partner,
  isSelected,
  onToggleSelection,
}: SelectablePartnerCardProps) => {
  const router = useRouter();

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

  const handleCardClick = () => {
    const url = `/partner/${partner.id}`;
    // Open in new tab/window when running in the browser
    if (typeof window !== "undefined") {
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    } else {
      // Fallback for non-browser environments
      router.push(url);
    }
  };

  const handleCheckboxClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Previene il click sulla card
    onToggleSelection();
  };

  return (
    <div
      className={cn(
        "max-w-sm transform overflow-hidden rounded-xl border transition-all duration-200",
        "relative bg-neutral-800 hover:shadow-lg",
        isSelected
          ? "border-primary-500 ring-primary-500/30 shadow-primary-500/20 ring-2"
          : "border-neutral-700 hover:border-neutral-600"
      )}
    >
      {/* Checkbox di selezione */}
      <div
        className="absolute top-3 right-3 z-10 cursor-pointer"
        onClick={handleCheckboxClick}
      >
        <Checkbox
          checked={isSelected}
          className={cn(
            "border-white bg-white shadow-lg",
            isSelected &&
              "data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
          )}
        />
      </div>

      {/* Area cliccabile della card */}
      <div className="cursor-pointer" onClick={handleCardClick}>
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
                <div
                  onClick={e => {
                    e.stopPropagation();
                    window.open(
                      partner.contact_info!.website!,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="text-primary-400 hover:text-primary-300 flex cursor-pointer items-center gap-1 text-sm transition-colors"
                >
                  🌐 Website
                </div>
              )}
              {partner.contact_info.phone && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    window.location.href = `tel:${partner.contact_info!.phone}`;
                  }}
                  className="text-primary-400 hover:text-primary-300 flex cursor-pointer items-center gap-1 text-sm transition-colors"
                >
                  📞 Call
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay di selezione */}
      {isSelected && (
        <div className="bg-primary-500/10 pointer-events-none absolute inset-0" />
      )}
    </div>
  );
};
