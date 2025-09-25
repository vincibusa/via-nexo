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

  // Extract detailed hotel information if available
  const hotelDetails = partner.rapid_api_data?.hotel_details;
  const sustainability = hotelDetails?.sustainability;
  const priceBreakdown = hotelDetails?.price_breakdown;
  const breakfastIncluded = hotelDetails?.breakfast_included;
  const availableRooms = hotelDetails?.available_rooms;

  const handleCardClick = () => {
    // Check for direct Booking.com URL from hotel details first
    const directBookingUrl = hotelDetails?.url;
    const fallbackUrl = partner.contact_info?.website;

    const externalUrl = directBookingUrl || fallbackUrl;
    const isBookingUrl =
      externalUrl &&
      (externalUrl.includes("booking.com") ||
        externalUrl.includes("rapidapi") ||
        externalUrl.startsWith("https://www.booking.com"));

    const url = isBookingUrl ? externalUrl : `/partner/${partner.id}`;

    // Open in new tab/window when running in the browser
    if (typeof window !== "undefined") {
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) newWindow.opener = null;
    } else {
      // Fallback for non-browser environments
      if (isBookingUrl) {
        // For external URLs in non-browser environments, we can't open them
        console.warn(
          "External URL cannot be opened in non-browser environment:",
          url
        );
      } else {
        router.push(url);
      }
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
            <div className="flex flex-col items-end">
              {priceBreakdown?.gross_amount_per_night ? (
                <div className="text-primary-400 text-sm font-semibold">
                  €{priceBreakdown.gross_amount_per_night.value.toFixed(0)}
                  /night
                </div>
              ) : (
                <div className="text-primary-400 text-xs font-medium">
                  {PriceRangeLabels[
                    partner.price_range as keyof typeof PriceRangeLabels
                  ] || partner.price_range}
                </div>
              )}
              {availableRooms && availableRooms > 0 && (
                <div className="text-xs text-green-400">
                  {availableRooms} rooms left
                </div>
              )}
            </div>
          </div>

          {/* Descrizione */}
          <p className="mb-3 text-sm leading-relaxed text-neutral-400">
            {truncateDescription(partner.description)}
          </p>

          {/* Hotel-specific badges */}
          {(sustainability ||
            breakfastIncluded ||
            priceBreakdown?.charges_details) && (
            <div className="mb-3 flex flex-wrap gap-1">
              {sustainability && (
                <span className="rounded-md border border-green-600/30 bg-green-700/30 px-2 py-1 text-xs text-green-300">
                  🌱{" "}
                  {sustainability.title ||
                    `Sustainable ${sustainability.level}`}
                </span>
              )}
              {breakfastIncluded && (
                <span className="rounded-md border border-orange-600/30 bg-orange-700/30 px-2 py-1 text-xs text-orange-300">
                  🍳 Breakfast included
                </span>
              )}
              {priceBreakdown?.charges_details && (
                <span className="rounded-md border border-blue-600/30 bg-blue-700/30 px-2 py-1 text-xs text-blue-300">
                  💶 +€{priceBreakdown.charges_details.amount.value.toFixed(0)}{" "}
                  taxes
                </span>
              )}
            </div>
          )}

          {/* Amenities/Features */}
          {partner.amenities && partner.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {/* Show more amenities for hotels with detailed information */}
              {partner.amenities
                .slice(0, hotelDetails ? 6 : 3)
                .map((amenity, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-neutral-700 px-2 py-1 text-xs text-neutral-300"
                  >
                    {amenity}
                  </span>
                ))}
              {partner.amenities.length > (hotelDetails ? 6 : 3) && (
                <span className="px-2 py-1 text-xs text-neutral-500">
                  +{partner.amenities.length - (hotelDetails ? 6 : 3)} more
                </span>
              )}
            </div>
          )}

          {/* Contatti (se disponibili) */}
          {(hotelDetails?.url || partner.contact_info) && (
            <div className="mt-3 flex items-center gap-3 border-t border-neutral-700 pt-3">
              {/* Prioritize direct Booking.com URL */}
              {hotelDetails?.url ? (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    window.open(
                      hotelDetails.url,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="text-primary-400 hover:text-primary-300 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
                >
                  🏨 Book on Booking.com
                </div>
              ) : (
                partner.contact_info?.website && (
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
                )
              )}
              {partner.contact_info?.phone && (
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
