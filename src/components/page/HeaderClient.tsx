"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "./Header";
import type { User } from "@supabase/supabase-js";

interface HeaderClientProps {
  initialUser: User | null;
}

export function HeaderClient({ initialUser }: HeaderClientProps) {
  console.log(
    "[HEADER_CLIENT] Received initial user:",
    initialUser?.email || "null"
  );

  const { forceSetUser, user: contextUser } = useAuth();

  // Force set the user from server if context user is null but we have initialUser
  useEffect(() => {
    if (initialUser && !contextUser) {
      console.log("[HEADER_CLIENT] 🔄 Forcing AuthContext user from server");
      forceSetUser(initialUser);
    }
  }, [initialUser, contextUser, forceSetUser]);

  return <Header />;
}
