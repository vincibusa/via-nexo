import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoIcon, NotificationIcon } from "./Icons";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-neutral-900/50 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <a className="flex items-center gap-3 text-white" href="#">
            <LogoIcon className="text-primary-500 h-8 w-8" />
            <h1 className="text-2xl font-bold">TravelAI</h1>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a
              className="hover:text-primary-400 text-sm font-medium text-neutral-200 transition-colors"
              href="#"
            >
              Explore
            </a>
            <a
              className="hover:text-primary-400 text-sm font-medium text-neutral-200 transition-colors"
              href="#"
            >
              Trips
            </a>
            <a
              className="hover:text-primary-400 text-sm font-medium text-neutral-200 transition-colors"
              href="#"
            >
              Community
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
      </nav>
    </header>
  );
};
