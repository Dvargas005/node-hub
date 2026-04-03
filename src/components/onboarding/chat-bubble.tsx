"use client";

export function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-[var(--font-lexend)] font-bold text-sm">
        N
      </div>
      <div className="max-w-[85%] bg-[#1a1a1a] border border-[rgba(245,246,252,0.08)] px-4 py-3 text-sm text-[var(--ice-white)]">
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-[var(--gold-bar)] px-4 py-3 text-sm text-[var(--asphalt-black)] font-medium">
        {children}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-[var(--font-lexend)] font-bold text-sm">
        N
      </div>
      <div className="bg-[#1a1a1a] border border-[rgba(245,246,252,0.08)] px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-[rgba(245,246,252,0.4)]"
              style={{
                animation: "pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
