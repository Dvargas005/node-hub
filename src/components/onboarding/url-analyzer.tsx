"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2 } from "lucide-react";

export function UrlAnalyzer({
  onResult,
  onFail,
  onSkip,
}: {
  onResult: (data: Record<string, string>, url: string) => void;
  onFail: (url: string) => void;
  onSkip: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (data.data) {
        onResult(data.data, data.url || url.trim());
      } else {
        onFail(url.trim());
      }
    } catch {
      onFail(url.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,246,252,0.4)]" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="tusitio.com"
            disabled={loading}
            className="pl-9 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)]"
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analizar"}
        </Button>
      </div>
      <button
        onClick={onSkip}
        disabled={loading}
        className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[rgba(245,246,252,0.6)]"
      >
        No tengo sitio web →
      </button>
    </div>
  );
}
