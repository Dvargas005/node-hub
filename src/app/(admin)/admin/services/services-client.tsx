"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryLabels, categoryColors } from "@/lib/status-labels";

interface Variant {
  id: string;
  name: string;
  creditCost: number;
  description: string;
  estimatedDays: number;
  minPlan: string | null;
  isPopular: boolean;
  isNew: boolean;
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  variants: Variant[];
}

const categories = ["DESIGN", "WEB", "MARKETING"] as const;

export function ServicesClient({ services }: { services: ServiceData[] }) {
  return (
    <div className="space-y-8">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        Catálogo de Servicios
      </h1>

      {categories.map((cat) => {
        const catServices = services.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-[var(--font-lexend)] text-lg font-semibold text-[var(--ice-white)]">
                {categoryLabels[cat]}
              </h2>
              <Badge className={categoryColors[cat]}>
                {catServices.length}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catServices.map((service) => (
                <Card
                  key={service.id}
                  className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
                      {service.name}
                    </CardTitle>
                    <p className="text-xs text-[rgba(245,246,252,0.5)]">
                      {service.description}
                    </p>
                    {service.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {service.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-[rgba(255,255,255,0.05)] text-[rgba(245,246,252,0.4)] px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {service.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-start justify-between border-t border-[rgba(245,246,252,0.06)] pt-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-[var(--ice-white)]">
                              {v.name}
                            </p>
                            {v.isPopular && (
                              <Badge className="text-[9px] bg-[var(--gold-bar)]/20 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 py-0">
                                Popular
                              </Badge>
                            )}
                            {v.isNew && (
                              <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30 py-0">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[rgba(245,246,252,0.4)]">
                            {v.estimatedDays}d
                            {v.minPlan && ` · Min: ${v.minPlan}`}
                          </p>
                        </div>
                        <span className="font-mono text-sm font-bold text-[var(--gold-bar)]">
                          {v.creditCost}cr
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
