import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiSearchIcon, SearchIcon } from "./Icons";

export const Hero = () => {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-6 py-16 text-center md:py-24">
      <h2 className="text-4xl font-extrabold text-white md:text-6xl">
        Find Your Next Adventure
      </h2>
      <p className="mt-4 max-w-2xl text-lg text-neutral-300">
        Describe your perfect trip, and let our AI create a personalized
        itinerary just for you. Or use our classic search to explore
        destinations.
      </p>
      <div className="mt-10 w-full max-w-2xl">
        <div className="glass-light p-2">
          <div className="relative flex w-full flex-col gap-4 md:flex-row">
            <div className="relative flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <SearchIcon className="text-neutral-400" />
              </div>
              <Input
                className="focus:ring-primary-500/50 w-full rounded-lg border-none bg-transparent py-3 pr-4 pl-12 text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:outline-none"
                placeholder="Search for a city, hotel, or attraction"
                type="text"
              />
            </div>
            <Button className="bg-primary-500 hover:bg-primary-600 focus:ring-primary-500/50 flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-colors duration-300 ease-in-out focus:ring-2 focus:outline-none">
              <AiSearchIcon />
              <span>AI Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
