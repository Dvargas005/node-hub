"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { translateIndustry, translateAudience } from "@/lib/i18n/data-labels";
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
  language?: string;
  deliveryLanguage?: string;
  phone?: string;
  whatsappNumber?: string;
  telegramId?: string;
  linkedinUrl?: string;
  instagramHandle?: string;
  preferredContact?: string;
}

export function SettingsClient({
  profile,
  totalCredits,
}: {
  profile: ProfileData;
  totalCredits: number;
}) {
  const router = useRouter();
  const { t } = useTranslation();
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
  const [platformLang, setPlatformLang] = useState(profile.language || "en");
  const [deliveryLang, setDeliveryLang] = useState(profile.deliveryLanguage || "en");

  // Contact info — separate state, NOT charged
  const [phone, setPhone] = useState(profile.phone || "");
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || "");
  const [telegramId, setTelegramId] = useState(profile.telegramId || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedinUrl || "");
  const [instagramHandle, setInstagramHandle] = useState(profile.instagramHandle || "");
  const [preferredContact, setPreferredContact] = useState(profile.preferredContact || "email");
  const [contactSaving, setContactSaving] = useState(false);

  const canAfford = totalCredits >= EDIT_COST;

  const handleSaveContact = async () => {
    setContactSaving(true);
    try {
      const res = await fetch("/api/profile/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          whatsappNumber,
          telegramId,
          linkedinUrl,
          instagramHandle,
          preferredContact,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(t("contact.saved"));
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setContactSaving(false);
    }
  };

  const handlePlatformLangChange = async (newLang: string) => {
    setPlatformLang(newLang);
    localStorage.setItem("node-language", newLang);
    document.cookie = `node-language=${newLang};path=/;max-age=31536000`;
    try {
      await fetch("/api/profile/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
    } catch {}
  };

  const handleDeliveryLangChange = async (newLang: string) => {
    setDeliveryLang(newLang);
    try {
      await fetch("/api/profile/language", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryLanguage: newLang }),
      });
      toast.success(t("settings.deliveryLanguage.saved"));
    } catch {}
  };

  const handleStartEdit = () => {
    if (!canAfford) {
      setError(`Editing your profile costs ${EDIT_COST} credits. You have ${totalCredits}.`);
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
        setError(data.error || "Error saving");
        return;
      }

      setSuccess("Profile updated successfully");
      setEditing(false);
      router.refresh();
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Settings
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
                  Editing your profile costs {EDIT_COST} credits
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">
                  Will be deducted from your available credits ({totalCredits}).
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingEdit(false)}
                    className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmEdit}
                    className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
                  >
                    Confirm ({EDIT_COST} credits)
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
              Business Profile
            </CardTitle>
            {!editing && !confirmingEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
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
                <Label className="text-[var(--ice-white)]">Business name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Industry</Label>
                <select value={businessIndustry} onChange={(e) => setBusinessIndustry(e.target.value)} className="w-full h-9 rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]">
                  <option value="">Select...</option>
                  {industries.map((i: any) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Description</Label>
                <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value.slice(0, 200))} rows={2} className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Target audience</Label>
                <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Brand colors</Label>
                <Input value={brandColors} onChange={(e) => setBrandColors(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Style</Label>
                <Input value={brandStyle} onChange={(e) => setBrandStyle(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)]" />
              </div>
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--ice-white)]">Facebook</Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Page name" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
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
                }} className="flex-1 border-[rgba(245,246,252,0.2)] text-[var(--ice-white)]">Cancel</Button>
                <Button onClick={handleSave} disabled={saving || !businessName || !businessIndustry || !businessDescription} className="flex-1 bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <ProfileRow label="Business" value={profile.businessName} />
              <ProfileRow label="Industry" value={translateIndustry(profile.businessIndustry, t)} />
              <ProfileRow label="Description" value={profile.businessDescription} />
              <ProfileRow label="Audience" value={translateAudience(profile.targetAudience, t)} />
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              <ProfileRow label="Colors" value={profile.brandColors} />
              <ProfileRow label="Style" value={profile.brandStyle} />
              <ProfileRow label="Web" value={profile.website} />
              <Separator className="bg-[rgba(245,246,252,0.1)]" />
              {Object.entries(profile.socialMedia || {}).map(([k, v]) => (
                <ProfileRow key={k} label={k} value={v} />
              ))}
              {Object.keys(profile.socialMedia || {}).length === 0 && (
                <ProfileRow label="Social" value="" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information — free to edit */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">{t("contact.title")}</CardTitle>
          <p className="text-xs text-[rgba(245,246,252,0.5)] mt-1">{t("contact.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.phone")}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("contact.placeholder.phone")}
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.whatsapp")}</Label>
            <Input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder={t("contact.placeholder.whatsapp")}
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.telegram")}</Label>
            <Input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder={t("contact.placeholder.telegram")}
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.linkedin")}</Label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder={t("contact.placeholder.linkedin")}
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.instagram")}</Label>
            <Input
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder={t("contact.placeholder.instagram")}
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">{t("contact.preferred")}</Label>
            <select
              value={preferredContact}
              onChange={(e) => setPreferredContact(e.target.value)}
              className="h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)] [&_option]:bg-[#1a1108] [&_option]:text-[var(--ice-white)]"
            >
              <option value="email">{t("contact.method.email")}</option>
              <option value="phone">{t("contact.method.phone")}</option>
              <option value="whatsapp">{t("contact.method.whatsapp")}</option>
              <option value="telegram">{t("contact.method.telegram")}</option>
            </select>
          </div>
          <Button
            onClick={handleSaveContact}
            disabled={contactSaving}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
          >
            <Save className="mr-2 h-4 w-4" />
            {contactSaving ? "Saving..." : t("settings.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Language settings */}
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">Language</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">Platform language</Label>
            <select
              value={platformLang}
              onChange={(e) => handlePlatformLangChange(e.target.value)}
              className="h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)]"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
              <option value="pt">🇧🇷 Português</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--ice-white)]">Deliverables language</Label>
            <p className="text-xs text-[rgba(245,246,252,0.4)]">The language your designs and content will be produced in</p>
            <select
              value={deliveryLang}
              onChange={(e) => handleDeliveryLangChange(e.target.value)}
              className="h-9 w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[#1a1108] px-3 text-sm text-[var(--ice-white)]"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
              <option value="pt">🇧🇷 Português</option>
            </select>
          </div>
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
