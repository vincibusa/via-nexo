"use client";

import { Suspense } from "react";
import { Background } from "@/components/page/Background";
import { SearchResults } from "@/components/page/SearchResults";

function SearchContent() {
  return <SearchResults />;
}

export default function SearchPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-neutral-900 text-neutral-50">
      <Background />
      <div className="relative z-10 mt-20 flex h-full min-h-screen grow flex-col">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-white">Caricamento risultati...</div>
            </div>
          }
        >
          <SearchContent />
        </Suspense>
      </div>
    </div>
  );
}
