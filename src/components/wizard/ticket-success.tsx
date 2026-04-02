"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles } from "lucide-react";

interface TicketInfo {
  id: string;
  number: number;
  serviceName: string;
  variantName: string;
  creditsCharged: number;
}

interface Suggestion {
  title: string;
  description: string;
  category: string;
  slug: string;
}

const crossSellMap: Record<string, Suggestion[]> = {
  "logo-design": [
    { slug: "social-media-design", title: "Templates para redes sociales", description: "Usa tu nueva marca en posts y stories profesionales", category: "DESIGN" },
    { slug: "print-design", title: "Tarjetas de presentación", description: "Lleva tu marca a lo físico con tarjetas profesionales", category: "DESIGN" },
  ],
  "brand-identity": [
    { slug: "social-media-design", title: "Diseño para redes sociales", description: "Aplica tu identidad en contenido para Instagram y Facebook", category: "DESIGN" },
    { slug: "landing-page", title: "Landing Page", description: "Crea una presencia web con tu nueva identidad de marca", category: "WEB" },
  ],
  "landing-page": [
    { slug: "seo-optimization", title: "Optimización SEO", description: "Potencia tu landing para que aparezca en Google", category: "MARKETING" },
    { slug: "paid-advertising", title: "Publicidad Digital", description: "Lleva tráfico calificado a tu nueva landing", category: "MARKETING" },
  ],
  "website-development": [
    { slug: "seo-optimization", title: "Optimización SEO", description: "Posiciona tu sitio web en los buscadores", category: "MARKETING" },
    { slug: "content-marketing", title: "Marketing de Contenido", description: "Contenido profesional para alimentar tu sitio", category: "MARKETING" },
  ],
  "social-media-design": [
    { slug: "social-media-management", title: "Community Management", description: "Deja que gestionemos tus redes con tu nuevo contenido", category: "MARKETING" },
  ],
  "social-media-management": [
    { slug: "paid-advertising", title: "Publicidad Digital", description: "Amplifica el alcance de tu contenido con ads", category: "MARKETING" },
  ],
  "content-marketing": [
    { slug: "seo-optimization", title: "Optimización SEO", description: "Que tu contenido aparezca en los primeros resultados", category: "MARKETING" },
  ],
  "email-marketing": [
    { slug: "landing-page", title: "Landing Page", description: "Crea una landing para captar leads de tus campañas", category: "WEB" },
  ],
};

export function TicketSuccess({
  ticket,
  serviceSlug,
}: {
  ticket: TicketInfo;
  serviceSlug?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!serviceSlug) return;
    const candidates = (crossSellMap[serviceSlug] || []).slice(0, 2);
    if (candidates.length === 0) return;

    fetch("/api/wizard/catalog")
      .then((r) => r.json())
      .then((data) => {
        if (!data.services) return;
        const slugs = new Set(data.services.map((s: { slug: string }) => s.slug));
        setSuggestions(candidates.filter((c) => slugs.has(c.slug)));
      })
      .catch(() => {});
  }, [serviceSlug]);

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

      {/* Cross-sell suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-8 w-full">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[var(--gold-bar)]" />
            <p className="text-sm font-medium text-[rgba(245,246,252,0.5)]">
              También te puede interesar
            </p>
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <Link key={s.title} href={`/request?category=${s.category}`}>
                <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.03)] transition-all cursor-pointer">
                  <CardContent className="py-3">
                    <p className="text-sm font-medium text-[var(--ice-white)]">
                      {s.title}
                    </p>
                    <p className="text-xs text-[rgba(245,246,252,0.4)]">
                      {s.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
