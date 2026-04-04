"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, AlertTriangle, Save } from "lucide-react";

const EDIT_COST = 10;

const industries = [
  "Restaurante", "Tienda / Retail", "Servicios profesionales",
  "Salud / Bienestar", "Tecnología", "Educación", "Eventos",
  "Construcción", "Transporte", "Otro",
];

interface ProfileData {
  businessName: string;
  businessIndustry: string;
  businessDescription: string;
  targetAudience: string;
  hasBranding: boolean | null | undefined;
  brandColors: string;
  brandStyle: string;
  website: string;
  socialMedia: Record<string, string>;
}

export function SettingsClient({
  profile,
  totalCredits,
}: {
  profile: ProfileData;
  totalCredits: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingEdit, setConfirmingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Editable state
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [businessIndustry, setBusinessIndustry] = useState(profile.businessIndustry);
  const [businessDescription, setBusinessDescription] = useState(profile.businessDescription);
  const [targetAudience, setTargetAudience] = useState(profile.targetAudience);
  const [brandColors, setBrandColors] = useState(profile.brandColors);
  const [brandStyle, setBrandStyle] = useState(profile.brandStyle);
  const [website, setWebsite] = useState(profile.website);
  const [instagram, setInstagram] = useState(profile.socialMedia?.instagram || "");
  const [facebook, setFacebook] = useState(profile.socialMedia?.facebook || "");

  const canAfford = totalCredits >= EDIT_COST;

  const handleStartEdit = () => {
    if (!canAfford) {
      setError(`Editar tu perfil cuesta ${EDIT_COST} créditos. Tienes ${totalCredits}.`);
      return;
    }
    setConfirmingEdit(true);
  };

  const handleConfirmEdit = () => {
    setConfirmingEdit(false);
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const socialMedia: Record<string, string> = {};
      if (instagram) socialMedia.instagram = instagram;
      if (facebook) socialMedia.facebook = facebook;

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessIndustry,
          businessDescription,
          targetAudience,
          hasBranding: profile.hasBranding,
          brandColors: brandColors || null,
          brandStyle: brandStyle || null,
          website: website || null,
          socialMedia: Object.keys(socialMedia).length > 0 ? socialMedia : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      setSuccess("Perfil actualizado correctamente");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Configuración
      </h1>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 p-3">
          {success}
        </div>
      )}

      {/* Edit confirmation dialog */}
      {confirmingEdit && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-400 font-medium">
                  Editar tu perfil cuesta {EDIT_COST} créditos
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">
                  Se descontarán de tus créditos disponibles ({totalCredits}).
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingEdit(false)}
                    className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmEdit}
                    className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
                  >
                    Confirmar ({EDIT_COST} créditos)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile card */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
              Perfil de empresa
            </CardTitle>
            {!editing && !confirmingEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] gap-1"
              >
                <Pencil className="h-3 w-3" />
                Editar
                <Badge className="bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 ml-1 text-[10px]">
                  {EDIT_COST} cr
                </Badge>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Nombre del negocio</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Giro / Industria</Label>
                <select value={businessIndustry} onChange={(e) => setBusinessIndustry(e.target.value)} className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]">
                  <option value="">Selecciona...</option>
                  {industries.map((i: any) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Descripción</Label>
                <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value.slice(0, 200))} rows={2} className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Público objetivo</Label>
                <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Colores de marca</Label>
                <Input value={brandColors} onChange={(e) => setBrandColors(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Estilo</Label>
                <Input value={brandStyle} onChange={(e) => setBrandStyle(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Sitio web</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Facebook</Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Nombre de página" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  setBusinessName(profile.businessName);
                  setBusinessIndustry(profile.businessIndustry);
                  setBusinessDescription(profile.businessDescription);
                  setTargetAudience(profile.targetAudience);
                  setBrandColors(profile.brandColors);
                  setBrandStyle(profile.brandStyle);
                  setWebsite(profile.website);
                  setInstagram(profile.socialMedia?.instagram || "");
                  setFacebook(profile.socialMedia?.facebook || "");
                }} className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving || !businessName || !businessIndustry || !businessDescription} className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <ProfileRow label="Negocio" value={profile.businessName} />
              <ProfileRow label="Giro" value={profile.businessIndustry} />
              <ProfileRow label="Descripción" value={profile.businessDescription} />
              <ProfileRow label="Público" value={profile.targetAudience} />
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <ProfileRow label="Colores" value={profile.brandColors} />
              <ProfileRow label="Estilo" value={profile.brandStyle} />
              <ProfileRow label="Web" value={profile.website} />
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              {Object.entries(profile.socialMedia || {}).map(([k, v]) => (
                <ProfileRow key={k} label={k} value={v} />
              ))}
              {Object.keys(profile.socialMedia || {}).length === 0 && (
                <ProfileRow label="Redes" value="" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[rgba(245,246,252,0.5)] capitalize">{label}</span>
      <span className="text-[var(--ice-white)] text-right max-w-[60%]">
        {value || <span className="text-[rgba(245,246,252,0.2)]">—</span>}
      </span>
    </div>
  );
}
