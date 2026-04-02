"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette, Monitor, Megaphone, ArrowRight } from "lucide-react";

const categories = [
  { key: "DESIGN", label: "Diseño & Branding", icon: Palette },
  { key: "WEB", label: "Desarrollo Web", icon: Monitor },
  { key: "MARKETING", label: "Marketing Digital", icon: Megaphone },
];

export function CategorySelector({
  onSelect,
  onFreeText,
}: {
  onSelect: (category: string) => void;
  onFreeText: (text: string) => void;
}) {
  const [freeText, setFreeText] = useState("");

  const handleFreeTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (freeText.trim()) {
      onFreeText(freeText.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h2 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          ¿Qué necesitas?
        </h2>
        <p className="mt-2 text-sm text-[rgba(245,246,252,0.5)]">
          Elige una categoría o describe tu proyecto
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-md">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className="flex items-center gap-4 rounded-none border border-[rgba(245,246,252,0.15)] bg-[rgba(255,255,255,0.03)] px-6 py-5 text-left transition-all hover:border-[var(--gold-bar)] hover:bg-[rgba(255,201,25,0.05)] group"
          >
            <cat.icon className="h-6 w-6 text-[var(--gold-bar)]" />
            <span className="font-[var(--font-lexend)] text-[var(--ice-white)] font-semibold group-hover:text-[var(--gold-bar)]">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 my-2">
          <div className="h-px flex-1 bg-[rgba(245,246,252,0.1)]" />
          <span className="text-xs text-[rgba(245,246,252,0.3)]">o</span>
          <div className="h-px flex-1 bg-[rgba(245,246,252,0.1)]" />
        </div>

        <form onSubmit={handleFreeTextSubmit} className="flex gap-2">
          <Input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Describe lo que necesitas con tus palabras..."
            className="flex-1 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
          />
          <Button
            type="submit"
            disabled={!freeText.trim()}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-4"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
