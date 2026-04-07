"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t("auth.resetPassword.mismatch")); return; }
    if (password.length < 8) { setError(t("auth.password.min")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(t("auth.resetPassword.expired"));
      }
    } catch {
      setError(t("auth.resetPassword.expired"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-sm text-red-400">{t("auth.resetPassword.expired")}</p>
          <Link href="/forgot-password" className="text-sm text-[var(--gold-bar)] hover:underline">{t("auth.forgotPassword.submit")}</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
      <CardHeader className="text-center">
        <CardTitle className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">N.O.D.E.</CardTitle>
        <CardDescription className="font-[var(--font-atkinson)] text-[rgba(245,246,252,0.5)]">{t("auth.resetPassword.title")}</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-400">{t("auth.resetPassword.success")}</p>
            <Link href="/login" className="text-sm text-[var(--gold-bar)] hover:underline">{t("auth.submit.login")}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-400 text-center">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--ice-white)]">{t("auth.resetPassword.newPassword")}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-[var(--ice-white)]">{t("auth.resetPassword.confirmPassword")}</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={8} className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50">
              {loading ? t("auth.resetPassword.updating") : t("auth.resetPassword.submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
