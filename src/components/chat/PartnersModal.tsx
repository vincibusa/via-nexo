import { PartnerData } from "@/types";
import { SelectablePartnerCard } from "./SelectablePartnerCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { usePartnerSelection } from "@/hooks/usePartnerSelection";
import { cn } from "@/lib/utils";

interface PartnersModalProps {
  partners: PartnerData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartPlanning?: (selectedPartners: PartnerData[]) => void;
}

const categoryConfig = {
  hotel: {
    label: "Hotel",
    icon: MapPin,
    color: "bg-blue-500",
  },
  restaurant: {
    label: "Ristoranti",
    icon: Users,
    color: "bg-green-500",
  },
  tour: {
    label: "Tour",
    icon: Calendar,
    color: "bg-purple-500",
  },
  shuttle: {
    label: "Trasporti",
    icon: Sparkles,
    color: "bg-orange-500",
  },
} as const;

export const PartnersModal = ({
  partners,
  open,
  onOpenChange,
  onStartPlanning,
}: PartnersModalProps) => {
  const [activeTab, setActiveTab] = useState<PartnerData["type"] | "all">(
    "all"
  );
  const {
    selectedPartners,
    selectionStats,
    hasSelections,
    togglePartner,
    isSelected,
    selectAllInCategory,
    deselectAllInCategory,
    clearAllSelections,
  } = usePartnerSelection();

  // Raggruppa partner per categoria
  const partnersByCategory = useMemo(() => {
    return {
      all: partners,
      hotel: partners.filter(p => p.type === "hotel"),
      restaurant: partners.filter(p => p.type === "restaurant"),
      tour: partners.filter(p => p.type === "tour"),
      shuttle: partners.filter(p => p.type === "shuttle"),
    };
  }, [partners]);

  // Partner da visualizzare per il tab attivo
  const displayPartners = partnersByCategory[activeTab] || [];

  // Statistiche per il tab attivo
  const getTabStats = (tabType: PartnerData["type"] | "all") => {
    if (tabType === "all") {
      return {
        total: partners.length,
        selected: selectedPartners.length,
      };
    }
    return {
      total: partnersByCategory[tabType]?.length || 0,
      selected: selectionStats.byCategory[tabType] || 0,
    };
  };

  const handleStartPlanning = () => {
    if (hasSelections && onStartPlanning) {
      onStartPlanning(selectedPartners);
      onOpenChange(false);
    }
  };

  const handleSelectAllInTab = () => {
    if (activeTab === "all") {
      // Seleziona tutti i partner
      partners.forEach(partner => {
        if (!isSelected(partner.id)) {
          togglePartner(partner);
        }
      });
    } else {
      selectAllInCategory(activeTab, partners);
    }
  };

  const handleDeselectAllInTab = () => {
    if (activeTab === "all") {
      clearAllSelections();
    } else {
      deselectAllInCategory(activeTab);
    }
  };

  const tabStats = getTabStats(activeTab);
  const allSelected =
    tabStats.selected === tabStats.total && tabStats.total > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="container mx-auto flex max-h-[80vh] !max-w-none flex-col border-neutral-700 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <MapPin className="text-primary-400 h-5 w-5" />
            Partner consigliati ({partners.length})
            {hasSelections && (
              <Badge variant="secondary" className="ml-2">
                {selectedPartners.length} selezionati
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-neutral-700 pb-4">
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className={cn(
              "text-sm",
              activeTab === "all" && "bg-primary-600 text-white"
            )}
          >
            Tutti ({partners.length})
          </Button>

          {(["hotel", "restaurant", "tour", "shuttle"] as const).map(
            category => {
              const config = categoryConfig[category];
              const categoryPartners = partnersByCategory[category];
              const selectedCount = selectionStats.byCategory[category];
              const IconComponent = config.icon;

              if (categoryPartners.length === 0) return null;

              return (
                <Button
                  key={category}
                  variant={activeTab === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(category)}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    activeTab === category && "bg-primary-600 text-white"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  {config.label} ({categoryPartners.length})
                  {selectedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {selectedCount}
                    </Badge>
                  )}
                </Button>
              );
            }
          )}
        </div>

        {/* Azioni per tab */}
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-neutral-400">
            {tabStats.selected} di {tabStats.total} selezionati
          </div>
          <div className="flex gap-2">
            {tabStats.selected > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAllInTab}
                className="text-neutral-400 hover:text-white"
              >
                Deseleziona {activeTab === "all" ? "tutti" : "categoria"}
              </Button>
            )}
            {!allSelected && tabStats.total > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAllInTab}
                className="text-primary-400 hover:text-primary-300"
              >
                Seleziona {activeTab === "all" ? "tutti" : "categoria"}
              </Button>
            )}
          </div>
        </div>

        {/* Griglia partner */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
            {displayPartners.map(partner => (
              <SelectablePartnerCard
                key={partner.id}
                partner={partner}
                isSelected={isSelected(partner.id)}
                onToggleSelection={() => togglePartner(partner)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between border-t border-neutral-700 pt-4">
          <div className="flex items-center gap-2">
            {hasSelections && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllSelections}
                className="text-neutral-400"
              >
                Pulisci selezioni
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Chiudi
            </Button>
            <Button
              onClick={handleStartPlanning}
              disabled={!hasSelections}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Crea Piano di Viaggio ({selectedPartners.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
