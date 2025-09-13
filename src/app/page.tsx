import { Background } from "@/components/page/Background";
import { HeroWrapper } from "@/components/page/HeroWrapper";
import { ProductFeatures } from "@/components/page/ProductFeatures";
import { HowItWorks } from "@/components/page/HowItWorks";
import { PopularDestinations } from "@/components/page/PopularDestinations";
import { CallToActionWrapper } from "@/components/page/CallToActionWrapper";

export default function Home() {
  return (
    <div className="relative w-full overflow-x-hidden bg-neutral-900 text-neutral-50">
      <Background />
      <div className="relative z-10 flex h-full min-h-screen grow flex-col">
        <HeroWrapper />
        <div id="features">
          <ProductFeatures />
        </div>
        <HowItWorks />
        <PopularDestinations />
        <CallToActionWrapper />
      </div>
    </div>
  );
}
