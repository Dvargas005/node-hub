"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Plus,
  Ticket,
  ArrowRight,
} from "lucide-react";
import {
  ticketStatusLabels as statusLabels,
  ticketStatusColors as statusColors,
} from "@/lib/status-labels";

interface DashboardClientProps {
  userName: string;
  freeCredits: number;
  subscription: {
    planName: string;
    creditsRemaining: number;
    monthlyCredits: number;
    status: string;
    periodEnd: string;
  } | null;
  activeTickets: number;
  lastTicket: {
    id: string;
    number: number;
    serviceName: string;
    variantName: string;
    status: string;
    createdAt: string;
  } | null;
}

export function DashboardClient({
  userName,
  freeCredits,
  subscription,
  activeTickets,
  lastTicket,
}: DashboardClientProps) {
  const totalCredits = freeCredits + (subscription?.creditsRemaining || 0);
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          Hola, {userName?.split(" ")[0] || "usuario"}
        </h1>
        <p className="mt-1 font-[var(--font-atkinson)] text-[rgba(245,246,252,0.5)]">
          Bienvenido a tu panel de N.O.D.E.
        </p>
      </div>

      {/* Free credits banner (no plan) */}
      {!subscription && freeCredits > 0 && (
        <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.05)]">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[rgba(245,246,252,0.5)]">Créditos de bienvenida</p>
              <span className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--gold-bar)]">{freeCredits}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No subscription CTA */}
      {!subscription && (
        <Card className="border-[var(--gold-bar)] bg-[rgba(255,201,25,0.05)]">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CreditCard className="h-12 w-12 text-[var(--gold-bar)]" />
            <div className="text-center">
              <h2 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
                Elige tu plan
              </h2>
              <p className="mt-1 text-sm text-[rgba(245,246,252,0.5)]">
                Suscríbete para empezar a solicitar servicios de diseño, web y
                marketing.
              </p>
            </div>
            <Link href="/billing">
              <Button className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-8">
                Ver planes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Subscription info */}
      {subscription && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[rgba(245,246,252,0.5)]">
                Plan actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
                {subscription.planName}
              </p>
              <Badge
                className={
                  subscription.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400 border-green-500/30 mt-1"
                    : "bg-red-500/20 text-red-400 border-red-500/30 mt-1"
                }
              >
                {subscription.status === "ACTIVE" ? "Activo" : subscription.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[rgba(245,246,252,0.5)]">
                Créditos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--gold-bar)]">
                  {totalCredits}
                </span>
                <span className="text-sm text-[rgba(245,246,252,0.4)]">
                  disponibles
                </span>
              </div>
              {freeCredits > 0 && (
                <p className="text-xs text-[rgba(245,246,252,0.3)] mt-1">
                  {freeCredits} gratis + {subscription.creditsRemaining} del plan
                </p>
              )}
              <div className="mt-2 h-1.5 rounded-full bg-[rgba(255,255,255,0.1)]">
                <div
                  className="h-full rounded-full bg-[var(--gold-bar)]"
                  style={{
                    width: `${Math.min(
                      (subscription.monthlyCredits > 0
                        ? (subscription.creditsRemaining /
                            subscription.monthlyCredits) *
                          100
                        : 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
            <CardHeader className="pb-2">
              <CardDescription className="text-[rgba(245,246,252,0.5)]">
                Tickets activos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-[var(--font-lexend)] text-3xl font-bold text-[var(--ice-white)]">
                {activeTickets}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last ticket */}
      {lastTicket && (
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardHeader>
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)]">
              Último ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--ice-white)]">
                  #{lastTicket.number} — {lastTicket.serviceName}
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">
                  {lastTicket.variantName} ·{" "}
                  {new Date(lastTicket.createdAt).toLocaleDateString("es-MX")}
                </p>
              </div>
              <Badge className={statusColors[lastTicket.status] || ""}>
                {statusLabels[lastTicket.status] || lastTicket.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/request">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]">
                <Plus className="h-5 w-5 text-[var(--gold-bar)]" />
              </div>
              <div>
                <p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">
                  Nueva Solicitud
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">
                  Crear un nuevo ticket
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tickets">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]">
                <Ticket className="h-5 w-5 text-[var(--gold-bar)]" />
              </div>
              <div>
                <p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">
                  Mis Tickets
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">
                  Ver todos tus tickets
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className="cursor-pointer border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)]">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[rgba(255,201,25,0.1)]">
                <CreditCard className="h-5 w-5 text-[var(--gold-bar)]" />
              </div>
              <div>
                <p className="font-[var(--font-lexend)] font-semibold text-[var(--ice-white)]">
                  Facturación
                </p>
                <p className="text-xs text-[rgba(245,246,252,0.4)]">
                  Plan, créditos y pagos
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
