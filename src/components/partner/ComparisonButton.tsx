"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Scale, Plus, Check } from "lucide-react";
import { useComparison } from "@/hooks/useComparison";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ComparisonButtonProps {
  partnerId: string;
  variant?: "icon" | "full";
  className?: string;
}

export const ComparisonButton: React.FC<ComparisonButtonProps> = ({
  partnerId,
  variant = "icon",
  className,
}) => {
  const router = useRouter();
  const { isInComparison, toggleComparison, canAddMore, comparisonItems } =
    useComparison();

  const isSelected = isInComparison(partnerId);
  const canAdd = canAddMore || isSelected;

  const handleClick = () => {
    const added = toggleComparison(partnerId);

    // If we now have 2+ items, optionally show comparison view
    if (added && comparisonItems.length >= 1) {
      // You could show a toast or notification here
      console.log(
        `Added to comparison. ${comparisonItems.length + 1} items ready to compare.`
      );
    }
  };

  const handleViewComparison = () => {
    router.push(`/comparison?items=${comparisonItems.join(",")}`);
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={!canAdd}
        className={cn(
          "h-11 w-11 hover:bg-neutral-700",
          isSelected && "bg-primary-600 hover:bg-primary-700",
          !canAdd && "cursor-not-allowed opacity-50",
          className
        )}
        aria-label={
          isSelected
            ? "Rimuovi dal confronto"
            : canAdd
              ? "Aggiungi al confronto"
              : "Massimo 4 elementi nel confronto"
        }
        aria-pressed={isSelected}
        title={
          isSelected
            ? "Rimuovi dal confronto"
            : canAdd
              ? "Aggiungi al confronto"
              : "Massimo 4 elementi nel confronto"
        }
      >
        {isSelected ? (
          <Check className="h-4 w-4 text-white" />
        ) : (
          <Scale className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={!canAdd}
        className={cn(
          "border-neutral-600 bg-neutral-700 text-neutral-200 hover:bg-neutral-600",
          isSelected &&
            "bg-primary-600 border-primary-600 hover:bg-primary-700 text-white",
          !canAdd && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {isSelected ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Nel confronto
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Confronta
          </>
        )}
      </Button>

      {comparisonItems.length > 1 && (
        <Button
          variant="outline"
          onClick={handleViewComparison}
          className="bg-primary-600 border-primary-600 hover:bg-primary-700 text-white"
        >
          <Scale className="mr-2 h-4 w-4" />
          Vedi confronto ({comparisonItems.length})
        </Button>
      )}
    </div>
  );
};
