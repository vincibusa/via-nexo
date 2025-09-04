import { SearchIcon, MapPinIcon, StarIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="from-primary-100/50 to-secondary-100/50 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[url('/hero-pattern.svg')] bg-center bg-repeat opacity-5" />

        <Container className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Hero Content */}
            <div className="glass-light mb-8 rounded-2xl p-8 md:p-12">
              <div className="mb-6">
                <Badge
                  variant="outline"
                  className="text-primary-700 mb-4 border-white/30 bg-white/20"
                >
                  🚀 Powered by AI
                </Badge>
                <h1 className="font-display mb-6 text-4xl leading-tight font-bold text-neutral-800 md:text-6xl">
                  Discover{" "}
                  <span className="from-primary-600 to-secondary-600 bg-gradient-to-r bg-clip-text text-transparent">
                    Italy
                  </span>{" "}
                  like never before
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-neutral-600 md:text-xl">
                  AI-powered recommendations for hidden gems, authentic
                  experiences, and unforgettable journeys across Italy&apos;s
                  most beautiful destinations.
                </p>
              </div>

              {/* Search Bar */}
              <div className="mx-auto max-w-2xl">
                <div className="relative">
                  <div className="glass-strong rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-neutral-500" />
                        <Input
                          placeholder="Where would you like to go? (Rome, Florence, Venice...)"
                          className="h-12 border-white/30 bg-white/50 pl-10 backdrop-blur-sm"
                        />
                      </div>
                      <Button
                        size="lg"
                        className="from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 h-12 bg-gradient-to-r px-8"
                      >
                        <SearchIcon className="mr-2 h-5 w-5" />
                        Search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-neutral-600">Popular:</span>
                {[
                  "Rome Hotels",
                  "Tuscany Tours",
                  "Venice Restaurants",
                  "Amalfi Coast",
                ].map(suggestion => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    className="text-primary-700 rounded-full hover:bg-white/30"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { icon: MapPinIcon, value: "1,000+", label: "Destinations" },
                { icon: StarIcon, value: "50,000+", label: "Reviews" },
                {
                  icon: UsersIcon,
                  value: "100,000+",
                  label: "Happy Travelers",
                },
                { icon: SearchIcon, value: "5,000+", label: "Partners" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="glass-light rounded-lg p-4 text-center"
                >
                  <stat.icon className="text-primary-600 mx-auto mb-2 h-8 w-8" />
                  <div className="mb-1 text-2xl font-bold text-neutral-800">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="bg-white/30 py-20">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold text-neutral-800 md:text-4xl">
              Why Choose Via Nexo?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-neutral-600">
              Experience Italy with our AI-powered platform that connects you
              with authentic local experiences
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: "🤖",
                title: "AI-Powered Recommendations",
                description:
                  "Our advanced AI analyzes your preferences to suggest personalized experiences that match your travel style.",
              },
              {
                icon: "🏛️",
                title: "Authentic Local Experiences",
                description:
                  "Connect with verified local partners offering genuine Italian experiences, from hidden trattorias to exclusive tours.",
              },
              {
                icon: "⚡",
                title: "Instant Smart Search",
                description:
                  "Find exactly what you're looking for with our intelligent search that understands natural language queries.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="glass-light border-white/20 transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 text-4xl">{feature.icon}</div>
                  <CardTitle className="text-xl font-semibold text-neutral-800">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed text-neutral-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
          <div className="glass-strong mx-auto max-w-4xl rounded-2xl p-12 text-center">
            <h2 className="font-display mb-6 text-3xl font-bold text-neutral-800 md:text-4xl">
              Ready to explore Italy?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-neutral-600">
              Join thousands of travelers who have discovered Italy&apos;s
              hidden gems with Via Nexo&apos;s AI-powered recommendations.
            </p>
            <div className="flex flex-col justify-center gap-4 md:flex-row">
              <Button
                size="lg"
                className="from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 bg-gradient-to-r"
              >
                Start Your Journey
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/20 hover:bg-white/30"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
