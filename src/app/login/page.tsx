"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email o password non corretti. Riprova.");
        } else if (error.message.includes("Email not confirmed")) {
          setError(
            "Per favore conferma il tuo account tramite l'email che ti abbiamo inviato."
          );
        } else {
          setError(error.message || "Errore durante il login. Riprova.");
        }
        setLoading(false);
      } else {
        // Successful login - redirect using window.location to ensure full page reload

        window.location.href = "/";
      }
    } catch {
      setError("Errore imprevisto. Riprova più tardi.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Via Nexo</h1>
          <p className="text-neutral-400">
            Accedi al tuo account per continuare
          </p>
        </div>

        <Card className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center text-white">
              <LogIn className="h-5 w-5" />
              Accedi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-600 bg-red-600/10 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tua@email.com"
                  required
                  className="border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="La tua password"
                    required
                    className="border-neutral-600 bg-neutral-700 pr-10 text-white placeholder:text-neutral-400"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-neutral-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 w-full text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accesso in corso...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Accedi
                  </>
                )}
              </Button>

              <div className="space-y-2 text-center">
                <p className="text-sm text-neutral-400">
                  Non hai ancora un account?{" "}
                  <Link
                    href={`/register${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Registrati qui
                  </Link>
                </p>

                <Link
                  href="#"
                  className="text-sm text-neutral-500 underline hover:text-neutral-400"
                >
                  Password dimenticata?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-400"
          >
            ← Torna alla homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
