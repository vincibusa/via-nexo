/**
 * Glass Component
 * Glassmorphism utility component for consistent glass effects
 */

import React from "react";
import { cn } from "@/lib/utils";
import type { GlassProps } from "@/types";

export function Glass({
  children,
  className,
  variant = "light",
  blur = "md",
  ...props
}: GlassProps & React.HTMLAttributes<HTMLDivElement>) {
  const glassClasses = {
    light: "glass-light",
    strong: "glass-strong",
  };

  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  return (
    <div
      className={cn(
        glassClasses[variant],
        // Override default blur if specified
        blur && blurClasses[blur],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Specialized glass components
export function GlassCard({
  children,
  className,
  ...props
}: GlassProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Glass className={cn("rounded-lg p-6", className)} {...props}>
      {children}
    </Glass>
  );
}

export function GlassHeader({
  children,
  className,
  ...props
}: GlassProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <header
      className={cn("glass-light border-b border-white/10", className)}
      {...props}
    >
      {children}
    </header>
  );
}

export function GlassModal({
  children,
  className,
  ...props
}: GlassProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Glass
      variant="strong"
      className={cn("mx-auto max-w-lg rounded-xl p-8", className)}
      {...props}
    >
      {children}
    </Glass>
  );
}
