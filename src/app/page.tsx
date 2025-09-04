import { Background } from "@/components/page/Background";
import { Hero } from "@/components/page/Hero";
import { PopularDestinations } from "@/components/page/PopularDestinations";

export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden bg-neutral-900 text-neutral-50">
      <Background />
      <div className="relative z-10 flex h-full min-h-screen grow flex-col">
        <Hero />
        <PopularDestinations />
      </div>
    </div>
  );
}
