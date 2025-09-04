/**
 * Navigation Component
 * Main navigation header with glassmorphism design
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon, SearchIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "./Container";
import { cn } from "@/lib/utils";
import type { MainNavItem } from "@/types";

const navigation: MainNavItem[] = [
  {
    title: "Discover",
    href: "/discover",
    description: "Find hotels, restaurants, and experiences",
  },
  {
    title: "Destinations",
    href: "/destinations",
    description: "Explore Italian cities and regions",
  },
  {
    title: "About",
    href: "/about",
    description: "Learn about Via Nexo",
  },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="glass-light sticky top-0 z-50 border-b border-white/10">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-primary-700 flex items-center space-x-2 text-xl font-bold"
          >
            <span className="text-2xl">🧭</span>
            <span>Via Nexo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-primary-600 focus:text-primary-600 text-sm font-medium text-neutral-700 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary-600 text-neutral-700"
            >
              <SearchIcon className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary-600 text-neutral-700"
            >
              <UserIcon className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-700 md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out md:hidden",
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-2 border-t border-white/10 py-4">
            {navigation.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-primary-600 block rounded-md px-4 py-2 text-base font-medium text-neutral-700 transition-colors hover:bg-white/5"
                onClick={() => setIsOpen(false)}
              >
                {item.title}
              </Link>
            ))}

            <div className="mt-4 border-t border-white/10 pt-4">
              <Link
                href="/search"
                className="hover:text-primary-600 block rounded-md px-4 py-2 text-base font-medium text-neutral-700 transition-colors hover:bg-white/5"
                onClick={() => setIsOpen(false)}
              >
                Search
              </Link>
              <Link
                href="/account"
                className="hover:text-primary-600 block rounded-md px-4 py-2 text-base font-medium text-neutral-700 transition-colors hover:bg-white/5"
                onClick={() => setIsOpen(false)}
              >
                Account
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
