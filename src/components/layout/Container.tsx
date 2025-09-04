/**
 * Container Component
 * Responsive container with consistent padding and max-width
 */

import { cn } from "@/lib/utils";
import type { ComponentProps } from "@/types";

interface ContainerProps extends ComponentProps {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: boolean;
}

const containerSizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export function Container({
  children,
  className,
  size = "lg",
  padding = true,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        containerSizes[size],
        padding && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
