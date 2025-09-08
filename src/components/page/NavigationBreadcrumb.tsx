"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface NavigationBreadcrumbProps {
  partnerName?: string;
  partnerType?: string;
}

export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  partnerName,
  partnerType,
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = () => {
    const items: {
      href: string;
      label: string;
      icon?: React.ReactNode;
      current?: boolean;
    }[] = [
      {
        href: "/",
        label: "Home",
        icon: <Home className="h-4 w-4" />,
      },
    ];

    if (pathname.startsWith("/search")) {
      items.push({
        href: "/search",
        label: "Search Results",
      });

      // Add search query if available
      const query = searchParams.get("query");
      if (query) {
        items.push({
          href:
            pathname +
            (searchParams.toString() ? `?${searchParams.toString()}` : ""),
          label: `"${query}"`,
        });
      }
    }

    if (pathname.startsWith("/partner/")) {
      items.push({
        href: "/search",
        label: "Search Results",
      });

      if (partnerType) {
        const typeCapitalized =
          partnerType.charAt(0).toUpperCase() + partnerType.slice(1);
        items.push({
          href: `/search?type=${partnerType}`,
          label: `${typeCapitalized}s`,
        });
      }

      if (partnerName) {
        items.push({
          href: pathname,
          label: partnerName,
          current: true,
        });
      }
    }

    if (pathname.startsWith("/chat")) {
      items.push({
        href: "/chat",
        label: "AI Chat",
        current: true,
      });
    }

    if (pathname.startsWith("/trips")) {
      items.push({
        href: "/trips",
        label: "My Trips",
        current: true,
      });
    }

    if (pathname.startsWith("/community")) {
      items.push({
        href: "/community",
        label: "Community",
        current: true,
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.href}>
                <BreadcrumbItem>
                  {item.current ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {item.icon}
                      <span className="max-w-[200px] truncate">
                        {item.label}
                      </span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="hover:text-foreground hover:text-primary-400 flex items-center gap-2 text-neutral-300 transition-colors"
                      >
                        {item.icon}
                        <span className="max-w-[150px] truncate">
                          {item.label}
                        </span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};
