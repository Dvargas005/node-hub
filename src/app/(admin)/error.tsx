"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="font-[var(--font-lexend)] text-xl font-bold text-[var(--ice-white)]">
        Something went wrong
      </h2>
      <p className="text-[rgba(245,246,252,0.5)]">{error.message || "Unexpected error"}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-bold"
      >
        Retry
      </button>
    </div>
  );
}
