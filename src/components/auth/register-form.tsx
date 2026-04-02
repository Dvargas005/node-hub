"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [allianceCode, setAllianceCode] = useState("");
  const [allianceValid, setAllianceValid] = useState<boolean | null>(null);
  const [allianceName, setAllianceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateAllianceCode = async (code: string) => {
    if (!code.trim()) {
      setAllianceValid(null);
      setAllianceName("");
      return;
    }

    try {
      const res = await fetch(
        `/api/alliance?code=${encodeURIComponent(code)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAllianceValid(true);
        setAllianceName(data.name);
      } else {
        setAllianceValid(false);
        setAllianceName("");
      }
    } catch {
      setAllianceValid(false);
      setAllianceName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName: businessName || undefined,
          allianceCode: allianceCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear cuenta");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
      <CardHeader className="text-center">
        <CardTitle className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          N.O.D.E.
        </CardTitle>
        <CardDescription className="font-[var(--font-atkinson)] text-[rgba(245,246,252,0.5)]">
          Crea tu cuenta para empezar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 text-center">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-[var(--ice-white)]">
              Nombre completo
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--ice-white)]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--ice-white)]">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
                className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(245,246,252,0.4)] hover:text-[var(--ice-white)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-[var(--ice-white)]">
              Nombre de tu negocio{" "}
              <span className="text-[rgba(245,246,252,0.3)]">(opcional)</span>
            </Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Mi Empresa S.A."
              className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allianceCode" className="text-[var(--ice-white)]">
              Código de alianza{" "}
              <span className="text-[rgba(245,246,252,0.3)]">(opcional)</span>
            </Label>
            <div className="relative">
              <Input
                id="allianceCode"
                type="text"
                value={allianceCode}
                onChange={(e) => {
                  setAllianceCode(e.target.value.toUpperCase());
                  validateAllianceCode(e.target.value);
                }}
                placeholder="Código de referido (opcional)"
                className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
              />
              {allianceValid === true && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
              )}
            </div>
            {allianceValid === true && (
              <p className="text-xs text-green-400">
                Alianza: {allianceName}
              </p>
            )}
            {allianceValid === false && allianceCode && (
              <p className="text-xs text-red-400">
                Código no válido
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>

          <p className="text-center text-sm text-[rgba(245,246,252,0.5)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-[var(--gold-bar)] hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
