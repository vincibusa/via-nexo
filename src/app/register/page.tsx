"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, UserPlus, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gdprConsent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  const { signUp, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /[0-9]/.test(formData.password),
    });
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) return "Il nome è obbligatorio";
    if (!formData.lastName.trim()) return "Il cognome è obbligatorio";
    if (!formData.email.trim()) return "L'email è obbligatoria";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Email non valida";
    if (!formData.phone.trim()) return "Il numero di telefono è obbligatorio";
    if (!/^\+\d{1,4}\s?\d{6,14}$/.test(formData.phone))
      return "Numero di telefono non valido (es: +39 123456789)";
    if (!Object.values(passwordStrength).every(Boolean))
      return "La password non soddisfa i requisiti di sicurezza";
    if (formData.password !== formData.confirmPassword)
      return "Le password non corrispondono";
    if (!formData.gdprConsent)
      return "Devi accettare i termini e le condizioni";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Combine first and last name for display name
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await signUp(
        formData.email,
        formData.password,
        displayName
      );

      if (error) {
        if (error.message.includes("User already registered")) {
          setError(
            "Esiste già un account con questa email. Prova ad accedere invece."
          );
        } else if (error.message.includes("Password should be")) {
          setError("La password deve essere di almeno 6 caratteri.");
        } else {
          setError(
            error.message || "Errore durante la registrazione. Riprova."
          );
        }
      } else {
        // Show success message
        setError("");
        alert(
          "Registrazione completata! Controlla la tua email per confermare l'account."
        );
        router.push("/login");
      }
    } catch {
      setError("Errore imprevisto. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({
    met,
    text,
  }: {
    met: boolean;
    text: string;
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${met ? "text-green-400" : "text-neutral-500"}`}
    >
      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {text}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Via Nexo</h1>
          <p className="text-neutral-400">Crea il tuo account per iniziare</p>
        </div>

        <Card className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center text-white">
              <UserPlus className="h-5 w-5" />
              Registrati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-600 bg-red-600/10 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-neutral-200">
                    Nome *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Mario"
                    required
                    className="border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-neutral-200">
                    Cognome *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Rossi"
                    required
                    className="border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-200">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="mario.rossi@email.com"
                  required
                  className="border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-200">
                  Telefono (con prefisso) *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+39 123456789"
                  required
                  className="border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-200">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Crea una password sicura"
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

                {/* Password Requirements */}
                {formData.password && (
                  <div className="space-y-1 rounded-md bg-neutral-700/50 p-3">
                    <PasswordRequirement
                      met={passwordStrength.length}
                      text="Almeno 8 caratteri"
                    />
                    <PasswordRequirement
                      met={passwordStrength.uppercase}
                      text="Una lettera maiuscola"
                    />
                    <PasswordRequirement
                      met={passwordStrength.lowercase}
                      text="Una lettera minuscola"
                    />
                    <PasswordRequirement
                      met={passwordStrength.number}
                      text="Un numero"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-neutral-200">
                  Conferma Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Ripeti la password"
                    required
                    className="border-neutral-600 bg-neutral-700 pr-10 text-white placeholder:text-neutral-400"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-neutral-400" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-400">
                      Le password non corrispondono
                    </p>
                  )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="gdprConsent"
                  checked={formData.gdprConsent}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      gdprConsent: checked === true,
                    }))
                  }
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="gdprConsent"
                    className="cursor-pointer text-sm text-neutral-300"
                  >
                    Accetto i{" "}
                    <Link
                      href="#"
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      Termini e Condizioni
                    </Link>{" "}
                    e l&apos;
                    <Link
                      href="#"
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      Informativa sulla Privacy
                    </Link>{" "}
                    (GDPR) *
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 w-full text-white"
                disabled={
                  loading || !Object.values(passwordStrength).every(Boolean)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrazione in corso...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrati
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  Hai già un account?{" "}
                  <Link
                    href={`/login${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Accedi qui
                  </Link>
                </p>
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
