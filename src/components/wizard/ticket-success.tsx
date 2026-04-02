"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

interface TicketInfo {
  id: string;
  number: number;
  serviceName: string;
  variantName: string;
  creditsCharged: number;
}

export function TicketSuccess({ ticket }: { ticket: TicketInfo }) {
  return (
    <div className="flex flex-col items-center py-12 max-w-md mx-auto">
      <div className="h-16 w-16 flex items-center justify-center bg-[rgba(255,201,25,0.1)] mb-6">
        <Check className="h-8 w-8 text-[var(--gold-bar)]" />
      </div>

      <h2 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)] text-center">
        ¡Solicitud creada!
      </h2>
      <p className="mt-2 text-[rgba(245,246,252,0.5)] text-center">
        Nuestro equipo revisará tu solicitud pronto
      </p>

      <Card className="mt-6 w-full border-[var(--gold-bar)] bg-[rgba(255,201,25,0.03)]">
        <CardContent className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[rgba(245,246,252,0.5)]">Ticket</span>
            <span className="font-mono text-[var(--gold-bar)] font-bold">
              #{ticket.number}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgba(245,246,252,0.5)]">Servicio</span>
            <span className="text-[var(--ice-white)]">{ticket.serviceName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgba(245,246,252,0.5)]">Variante</span>
            <span className="text-[var(--ice-white)]">{ticket.variantName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[rgba(245,246,252,0.5)]">Créditos</span>
            <span className="text-[var(--gold-bar)] font-bold">
              {ticket.creditsCharged}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-6 w-full">
        <Link href="/tickets" className="flex-1">
          <Button className="w-full bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold">
            Ver mis tickets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/dashboard" className="flex-1">
          <Button
            variant="outline"
            className="w-full border-[rgba(245,246,252,0.2)] text-[var(--ice-white)] hover:bg-[rgba(255,255,255,0.05)]"
          >
            Ir al panel
          </Button>
        </Link>
      </div>
    </div>
  );
}
