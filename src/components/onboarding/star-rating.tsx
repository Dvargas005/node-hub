"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingRow {
  label: string;
  key: string;
}

export function StarRating({
  rows,
  onConfirm,
}: {
  rows: RatingRow[];
  onConfirm: (ratings: Record<string, number>) => void;
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const setRating = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const allRated = rows.every((r) => ratings[r.key] && ratings[r.key] > 0);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-[rgba(245,246,252,0.7)] min-w-[100px]">
            {row.label}
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(row.key, star)}
                className="p-0.5"
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    star <= (ratings[row.key] || 0)
                      ? "fill-[var(--gold-bar)] text-[var(--gold-bar)]"
                      : "text-[rgba(245,246,252,0.2)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
      {allRated && (
        <Button
          onClick={() => onConfirm(ratings)}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4 mt-2"
        >
          Confirmar
        </Button>
      )}
    </div>
  );
}
