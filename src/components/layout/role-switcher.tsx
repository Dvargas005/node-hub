"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const roles = [
  { key: "ADMIN", label: "Admin", emoji: "👑", path: "/admin/overview" },
  { key: "PM", label: "PM", emoji: "📋", path: "/admin/overview" },
  { key: "FREELANCER", label: "Freelancer", emoji: "🎨", path: "/freelancer/portal" },
  { key: "CLIENT", label: "Cliente", emoji: "👤", path: "/dashboard" },
];

export function useViewAsRole(realRole: string | undefined) {
  const [viewAs, setViewAs] = useState<string | null>(null);

  useEffect(() => {
    if (realRole !== "ADMIN") return;
    const saved = localStorage.getItem("node-view-as-role");
    if (saved && saved !== "ADMIN") setViewAs(saved);
  }, [realRole]);

  return viewAs;
}

export function RoleSwitcher({ userRole }: { userRole: string }) {
  const [viewAs, setViewAs] = useState("ADMIN");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("node-view-as-role");
    if (saved) setViewAs(saved);
  }, []);

  if (userRole !== "ADMIN") return null;

  function switchRole(role: string) {
    setViewAs(role);
    setOpen(false);
    localStorage.setItem("node-view-as-role", role);
    document.cookie = `node-view-as-role=${role};path=/;max-age=86400`;
    const target = roles.find((r: any) => r.key === role);
    router.push(target?.path || "/admin/overview");
  }

  const current = roles.find((r: any) => r.key === viewAs) || roles[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-2.5 py-1.5 text-xs text-[rgba(245,246,252,0.7)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
      >
        <span>{current.emoji}</span>
        <span>{current.label}</span>
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 border border-[rgba(245,246,252,0.1)] bg-[var(--asphalt-black)] shadow-lg">
            {roles.map((r: any) => (
              <button
                key={r.key}
                onClick={() => switchRole(r.key)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  viewAs === r.key
                    ? "bg-[var(--gold-bar)]/10 text-[var(--gold-bar)]"
                    : "text-[rgba(245,246,252,0.7)] hover:bg-[rgba(255,255,255,0.05)]"
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ViewAsBanner() {
  const [viewAs, setViewAs] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("node-view-as-role");
    if (saved && saved !== "ADMIN") setViewAs(saved);
  }, []);

  if (!viewAs) return null;

  const label = roles.find((r: any) => r.key === viewAs)?.label || viewAs;

  function resetView() {
    setViewAs(null);
    localStorage.removeItem("node-view-as-role");
    document.cookie = "node-view-as-role=;path=/;max-age=0";
    router.push("/admin/overview");
  }

  return (
    <div className="bg-yellow-500 text-black text-center py-1 text-sm font-medium">
      Viendo como: {label} —{" "}
      <button onClick={resetView} className="underline font-bold">
        Volver a Admin
      </button>
    </div>
  );
}
