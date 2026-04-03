"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ChipSelector({
  options,
  multiSelect = false,
  onConfirm,
}: {
  options: string[];
  multiSelect?: boolean;
  onConfirm: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (opt: string) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    } else {
      setSelected([opt]);
    }
  };

  const handleConfirm = () => {
    if (selected.length > 0) onConfirm(selected);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-2 text-sm border transition-all ${
              selected.includes(opt)
                ? "border-[var(--gold-bar)] bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-medium"
                : "border-[rgba(245,246,252,0.2)] bg-transparent text-[rgba(245,246,252,0.7)] hover:border-[var(--gold-bar)]"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <Button
          onClick={handleConfirm}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4"
        >
          Confirmar
        </Button>
      )}
    </div>
  );
}
