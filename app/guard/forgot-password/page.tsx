"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { guardApiClient} from "@/lib/guard-api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const countryCodeOptions = [
  { code: "+1", country: "États-Unis", flag: "🇺🇸" },
  { code: "+44", country: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+49", country: "Allemagne", flag: "🇩🇪" },
  { code: "+39", country: "Italie", flag: "🇮🇹" },
  { code: "+34", country: "Espagne", flag: "🇪🇸" },
  { code: "+32", country: "Belgique", flag: "🇧🇪" },
  { code: "+41", country: "Suisse", flag: "🇨🇭" },
  { code: "+31", country: "Pays-Bas", flag: "🇳🇱" },
  { code: "+43", country: "Autriche", flag: "🇦🇹" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+212", country: "Maroc", flag: "🇲🇦" },
  { code: "+213", country: "Algérie", flag: "🇩🇿" },
  { code: "+216", country: "Tunisie", flag: "🇹🇳" },
  { code: "+221", country: "Sénégal", flag: "🇸🇳" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+237", country: "Cameroun", flag: "🇨🇲" },
  { code: "+33", country: "France", flag: "🇫🇷" },
];

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState("+221"); 
  const router = useRouter();

  const handleForgotPassword = async () => {
    setIsLoading(true);
    setError("");

    try {
      const fullPhoneNumber = countryCode + phoneNumber;
      const response = await guardApiClient.forgotPassword(fullPhoneNumber);
      setSuccess(response.data?.message ?? "");
      setStep(2);
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        setError((error as { message: string }).message || "Une erreur est survenue");
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const fullPhoneNumber = countryCode + phoneNumber;
      const response = await guardApiClient.resetPassword(fullPhoneNumber, newPassword, confirmPassword);
      setSuccess(response.data?.message ?? "");
      setTimeout(() => {
        router.push("/guard/login");
      }, 2000);
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        setError((error as { message?: string }).message || "Une erreur est survenue");
      } else {
        setError("Une erreur est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link href="/guard/login">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <CardTitle className="text-2xl text-white">Mot de passe oublié</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              {step === 1 ? "Saisissez votre numéro de téléphone" : "Saisissez votre nouveau mot de passe"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-500/20 border-green-500/50 text-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-white">
                    Numéro de téléphone
                  </Label>
                  <div className="flex space-x-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600 max-h-60">
                        {countryCodeOptions.map((option, index) => (
                          <SelectItem
                            key={`${option.code}-${option.country}-${index}`}
                            value={option.code}
                            className="text-white"
                          >
                            <span className="flex items-center space-x-2">
                              <span>{option.flag}</span>
                              <span>{option.code}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="123456789"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleForgotPassword}
                  className="w-full bg-amber-400 text-slate-900 hover:bg-amber-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Vérification en cours..." : "Vérifier le numéro"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleResetPassword}
                  className="w-full bg-amber-400 text-slate-900 hover:bg-amber-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


