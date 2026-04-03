"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
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
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      // Redirect based on role
      const role = (result.data?.user as Record<string, unknown>)?.role as string;
      if (role === "ADMIN" || role === "PM") {
        router.push("/admin/overview");
      } else {
        router.push("/dashboard");
      }
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
          Inicia sesión en tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 text-center">{error}</div>
          )}
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
                placeholder="••••••••"
                required
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
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </Button>
          <p className="text-center text-sm text-[rgba(245,246,252,0.5)]">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-[var(--gold-bar)] hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
