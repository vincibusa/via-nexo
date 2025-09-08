"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Plane, Users, Search, MessageCircle } from "lucide-react";
import { LogoIcon, NotificationIcon } from "./Icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/search", label: "Explore", icon: Search },
    { href: "/chat", label: "AI Chat", icon: MessageCircle },
    { href: "/trips", label: "My Trips", icon: Plane },
    { href: "/community", label: "Community", icon: Users },
  ];

  return (
    <header className="bg-primary sticky top-0 z-50 w-full backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link className="flex items-center gap-3 text-white" href="/">
            <LogoIcon className="text-primary-500 h-8 w-8" />
            <h1 className="text-2xl font-bold">Via Nexo</h1>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(link => {
              const isActive =
                pathname === link.href ||
                (link.href === "/search" && pathname.startsWith("/partner"));
              return (
                <Link
                  key={link.label}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary-400"
                      : "hover:text-primary-400 text-neutral-200"
                  )}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop Icons */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon">
            <NotificationIcon className="h-6 w-6 text-neutral-400" />
          </Button>
          <Avatar>
            <div
              className="h-10 w-10 rounded-full bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSDadV-FeA2f-DQZLW7TYz-rfu2diYCKw1QU4O0FVAeW4ViW8OfcALFpE_e3Hzo7nsW3sVw8csOHG2s5x84kLL6cIgKpPsImk3jEeqc2-Xh-xLWbMWkF2VlwKYzlKvIPeGVl1f8EYj0I87kwsXiCwIBqGwGa1aqMIKxFm5EPJh2vvKDy9usjCTaPJYoZWs0pLMfRKpaHE2PtF8WXM9p_QEBoHtI2Sw5A1RaQ2dEPkeov3fQflIOrAhpxXcG228z7-_KL8CdwcPhP6h")',
              }}
            />
          </Avatar>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="text-primary-500 h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-l-0 bg-neutral-900/80 backdrop-blur-md"
            >
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col gap-2 pt-6">
                {navLinks.map(link => {
                  const isActive =
                    pathname === link.href ||
                    (link.href === "/search" &&
                      pathname.startsWith("/partner"));
                  return (
                    <Link
                      key={link.label}
                      className={cn(
                        "flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-neutral-800",
                        isActive
                          ? "text-primary-400 bg-neutral-800/50"
                          : "hover:text-primary-400 text-neutral-200"
                      )}
                      href={link.href}
                    >
                      <link.icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "text-primary-400" : "text-primary-500"
                        )}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
