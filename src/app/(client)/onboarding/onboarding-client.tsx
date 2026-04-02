"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";

const industries = [
  "Restaurante",
  "Tienda / Retail",
  "Servicios profesionales",
  "Salud / Bienestar",
  "Tecnología",
  "Educación",
  "Eventos",
  "Construcción",
  "Transporte",
  "Otro",
];

const styleOptions = [
  "Minimalista",
  "Bold / Atrevido",
  "Elegante",
  "Moderno",
  "Clásico",
  "Divertido",
  "Corporativo",
];

type BrandingStatus = "yes" | "no" | "basic" | null;

export function OnboardingClient({
  initialBusinessName,
}: {
  initialBusinessName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [businessIndustry, setBusinessIndustry] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Step 2
  const [hasBranding, setHasBranding] = useState<BrandingStatus>(null);
  const [brandColors, setBrandColors] = useState("");
  const [brandStyle, setBrandStyle] = useState<string[]>([]);
  const [website, setWebsite] = useState("");

  // Step 3
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [noSocial, setNoSocial] = useState(false);

  const toggleStyle = (s: string) => {
    setBrandStyle((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const canProceedStep1 = businessDescription.trim().length > 0;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const socialMedia =
      noSocial || (!instagram && !facebook && !tiktok && !linkedin)
        ? null
        : {
            ...(instagram && { instagram }),
            ...(facebook && { facebook }),
            ...(tiktok && { tiktok }),
            ...(linkedin && { linkedin }),
          };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessIndustry,
          businessDescription,
          targetAudience,
          hasBranding: hasBranding === "yes" ? true : hasBranding === "no" ? false : null,
          brandColors: brandColors || null,
          brandStyle: brandStyle.length > 0 ? brandStyle.join(", ") : null,
          website: website || null,
          socialMedia,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[80vh] justify-center px-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-12 transition-colors ${
              s <= step
                ? "bg-[var(--gold-bar)]"
                : "bg-[rgba(245,246,252,0.1)]"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 p-3 mb-4 w-full max-w-md">
          {error}
        </div>
      )}

      <Card className="w-full max-w-md border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                Tu negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  Nombre del negocio
                </Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Mi Empresa"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  Giro / Industria
                </Label>
                <select
                  value={businessIndustry}
                  onChange={(e) => setBusinessIndustry(e.target.value)}
                  className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-[var(--ice-white)]"
                >
                  <option value="">Selecciona...</option>
                  {industries.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  ¿Qué hace tu negocio?{" "}
                  <span className="text-[rgba(245,246,252,0.4)]">*</span>
                </Label>
                <textarea
                  value={businessDescription}
                  onChange={(e) =>
                    setBusinessDescription(e.target.value.slice(0, 200))
                  }
                  placeholder="Cuéntanos en una oración qué hace tu negocio"
                  rows={2}
                  className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] resize-none"
                />
                <p className="text-xs text-[rgba(245,246,252,0.3)] text-right">
                  {businessDescription.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  ¿A quién le vendes?
                </Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ej: Mujeres 25-45, profesionistas, zona metropolitana"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                Tu marca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  ¿Ya tienes logo o identidad visual?
                </Label>
                <div className="flex gap-2">
                  {(
                    [
                      ["yes", "Sí"],
                      ["no", "No"],
                      ["basic", "Algo básico"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setHasBranding(val)}
                      className={`flex-1 py-2 text-sm border transition-colors ${
                        hasBranding === val
                          ? "border-[var(--gold-bar)] bg-[rgba(255,201,25,0.1)] text-[var(--gold-bar)]"
                          : "border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.5)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(hasBranding === "yes" || hasBranding === "basic") && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">
                      ¿Cuáles son tus colores?
                    </Label>
                    <Input
                      value={brandColors}
                      onChange={(e) => setBrandColors(e.target.value)}
                      placeholder="Ej: Azul marino, blanco, dorado"
                      className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">
                      Estilo de tu marca
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {styleOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggleStyle(s)}
                          className={`px-3 py-1.5 text-xs border transition-colors ${
                            brandStyle.includes(s)
                              ? "border-[var(--gold-bar)] bg-[rgba(255,201,25,0.1)] text-[var(--gold-bar)]"
                              : "border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.03)] text-[rgba(245,246,252,0.5)]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">
                  Sitio web actual{" "}
                  <span className="text-[rgba(245,246,252,0.3)]">
                    (opcional)
                  </span>
                </Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://misitio.com"
                  className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
                Tus redes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-[rgba(245,246,252,0.5)]">
                <input
                  type="checkbox"
                  checked={noSocial}
                  onChange={(e) => setNoSocial(e.target.checked)}
                  className="accent-[var(--gold-bar)]"
                />
                Aún no tengo redes sociales
              </label>

              {!noSocial && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">Instagram</Label>
                    <Input
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@tuhandle"
                      className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">Facebook</Label>
                    <Input
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="Nombre de tu página"
                      className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">TikTok</Label>
                    <Input
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="@tuhandle"
                      className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--ice-white)]">LinkedIn</Label>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="URL de tu perfil o empresa"
                      className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
                >
                  {loading ? "Guardando..." : "Completar"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
