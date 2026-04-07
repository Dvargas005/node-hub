"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/reset-password" }),
      });
    } catch {}
    // Always show success to prevent email enumeration
    setSent(true);
    setLoading(false);
  };

  return (
    <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
      <CardHeader className="text-center">
        <CardTitle className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          N.O.D.E.
        </CardTitle>
        <CardDescription className="font-[var(--font-atkinson)] text-[rgba(245,246,252,0.5)]">
          {t("auth.forgotPassword.title")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-400">{t("auth.forgotPassword.success")}</p>
            <Link href="/login" className="text-sm text-[var(--gold-bar)] hover:underline">
              {t("auth.forgotPassword.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[rgba(245,246,252,0.5)]">
              {t("auth.forgotPassword.subtitle")}
            </p>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--ice-white)]">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50">
              {loading ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.submit")}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-[var(--gold-bar)] hover:underline">{t("auth.forgotPassword.backToLogin")}</Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
