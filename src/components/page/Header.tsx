import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Compass, Plane, Users } from "lucide-react";
import { LogoIcon, NotificationIcon } from "./Icons";

export const Header = () => {
  const navLinks = [
    { href: "#", label: "Explore", icon: Compass },
    { href: "#", label: "Trips", icon: Plane },
    { href: "#", label: "Community", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-900/50 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <a className="flex items-center gap-3 text-white" href="#">
            <LogoIcon className="text-primary-500 h-8 w-8" />
            <h1 className="text-2xl font-bold">Via Nexo</h1>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map(link => (
              <a
                key={link.label}
                className="hover:text-primary-400 text-sm font-medium text-neutral-200 transition-colors"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
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
                {navLinks.map(link => (
                  <a
                    key={link.label}
                    className="hover:text-primary-400 flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
                    href={link.href}
                  >
                    <link.icon className="text-primary-500 h-6 w-6" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
