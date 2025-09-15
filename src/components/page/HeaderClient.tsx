"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Plane,
  Users,
  Search,
  MessageCircle,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { LogoIcon, NotificationIcon } from "./Icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/auth-api";

interface HeaderClientProps {
  initialUser: SupabaseUser | null;
  initialUserProfile: UserProfile | null;
}

export function HeaderClient({
  initialUser,
  initialUserProfile,
}: HeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use server-provided data directly but get signOut from context
  const user = initialUser;
  const userProfile = initialUserProfile;
  const { signOut } = useAuth();

  console.log("[HEADER_CLIENT] Rendering with:", {
    user: user?.email || "null",
    userProfile: userProfile?.display_name || "null",
  });

  // Filter navigation links based on authentication status
  const allNavLinks = [
    { href: "/search", label: "Explore", icon: Search },
    {
      href: "/chat",
      label: "AI Chat",
      icon: MessageCircle,
      authRequired: true,
    },
    { href: "/trips", label: "My Trips", icon: Plane, authRequired: true },
    { href: "/community", label: "Community", icon: Users },
  ];

  const navLinks = user
    ? allNavLinks
    : allNavLinks.filter(link => !link.authRequired);

  const handleSignOut = async () => {
    console.log("[HEADER_CLIENT] Logout button clicked");
    setIsLoggingOut(true);

    try {
      // Use the new API-based signOut
      await signOut();

      // Clear local storage and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        router.push("/?t=" + Date.now());
      }
    } catch (error) {
      console.error("[HEADER_CLIENT] Error during logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

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
          {user ? (
            <>
              <Button variant="ghost" size="icon">
                <NotificationIcon className="h-6 w-6 text-neutral-400" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={userProfile?.avatar_url}
                        alt={userProfile?.display_name || user.email}
                      />
                      <AvatarFallback className="bg-primary-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {userProfile?.display_name && (
                        <p className="font-medium">
                          {userProfile.display_name}
                        </p>
                      )}
                      <p className="text-muted-foreground w-[200px] truncate text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profilo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Impostazioni
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Uscendo..." : "Esci"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="text-neutral-200">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Accedi
                </Link>
              </Button>
              <Button asChild className="bg-primary-600 hover:bg-primary-700">
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrati
                </Link>
              </Button>
            </div>
          )}
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
                {/* Navigation Links */}
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

                {/* Authentication Section */}
                <div className="mt-6 border-t border-neutral-700 pt-6">
                  {user ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 px-4 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={userProfile?.avatar_url}
                            alt={userProfile?.display_name || user.email}
                          />
                          <AvatarFallback className="bg-primary-600 text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          {userProfile?.display_name && (
                            <p className="font-medium text-white">
                              {userProfile.display_name}
                            </p>
                          )}
                          <p className="truncate text-sm text-neutral-400">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* User Actions */}
                      <Link
                        href="/profile"
                        className="hover:text-primary-400 flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
                      >
                        <User className="text-primary-500 h-6 w-6" />
                        <span>Profilo</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="hover:text-primary-400 flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
                      >
                        <Settings className="text-primary-500 h-6 w-6" />
                        <span>Impostazioni</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="hover:text-primary-400 flex w-full items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-neutral-200 transition-colors hover:bg-neutral-800 disabled:opacity-50"
                      >
                        <LogOut className="text-primary-500 h-6 w-6" />
                        <span>{isLoggingOut ? "Uscendo..." : "Esci"}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="hover:text-primary-400 flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
                      >
                        <LogIn className="text-primary-500 h-6 w-6" />
                        <span>Accedi</span>
                      </Link>
                      <Link
                        href="/register"
                        className="bg-primary-600 hover:bg-primary-700 flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium text-white transition-colors"
                      >
                        <UserPlus className="h-6 w-6" />
                        <span>Registrati</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
