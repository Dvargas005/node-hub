"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
}

interface BriefData {
  suggestedServiceSlug: string;
  suggestedVariantId: string;
  summary: string;
  details: {
    deliverable: string;
    style: string;
    content: string;
    extras: string;
  };
  pmAlert?: string | null;
  discount?: { percent: number; extendedDays: number; originalDays: number } | null;
  firstRoundBonus?: number;
  insufficientCredits?: boolean;
}

function parseBrief(text: string): BriefData | null {
  const match = text.match(/:::BRIEF_JSON:::([\s\S]*?):::END_BRIEF:::/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.suggestedServiceSlug || !parsed.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseQuickReplies(text: string): string[] {
  const match = text.match(/:::QUICK_REPLIES:::([\s\S]*?):::END_QUICK_REPLIES:::/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1].trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripMeta(text: string): string {
  return text
    .replace(/:::BRIEF_JSON:::[\s\S]*?:::END_BRIEF:::/, "")
    .replace(/:::QUICK_REPLIES:::[\s\S]*?:::END_QUICK_REPLIES:::/, "")
    .trim();
}

function buildFormContext(answers: Record<string, unknown>, serviceSlug: string): string {
  let context = `The client filled out a pre-order form for "${serviceSlug}":\n`;
  for (const [key, value] of Object.entries(answers)) {
    if (value !== undefined && value !== null && value !== "") {
      context += `- ${key}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
    }
  }
  context +=
    "\nReview these answers. If the brief is complete enough, generate it immediately with :::BRIEF_JSON:::. Only ask ONE clarifying question if something CRITICAL is missing. Do NOT re-ask what they already answered.";
  return context;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
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
  );
}

export function ChatInterface({
  category,
  serviceSlug,
  initialMessage,
  formAnswers,
  onBriefGenerated,
  variants,
}: {
  category?: string;
  serviceSlug?: string;
  initialMessage?: string;
  formAnswers?: Record<string, unknown>;
  onBriefGenerated: (brief: BriefData, messages: ChatMessage[]) => void;
  variants?: Record<string, { name: string; creditCost: number }>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Auto-send on mount
  useEffect(() => {
    if (started) return;
    setStarted(true);

    if (formAnswers && serviceSlug) {
      const formContext = buildFormContext(formAnswers, serviceSlug);
      sendMessage(formContext, true);
    } else if (initialMessage) {
      sendMessage(initialMessage);
    } else if (category) {
      const categoryLabels: Record<string, string> = {
        DESIGN: "design and branding",
        WEB: "web development",
        MARKETING: "digital marketing",
      };
      sendMessage(`Hi, I need help with a ${categoryLabels[category] || category} project.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text: string, hidden = false) => {
    const userMsg: ChatMessage = { role: "user", content: text, hidden };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setQuickReplies([]);

    try {
      const res = await fetch("/api/wizard/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          category,
          formAnswers,
          serviceSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.error || t("common.error") },
        ]);
        return;
      }

      const assistantMsg: ChatMessage = { role: "assistant", content: data.message };
      const allMessages = [...newMessages, assistantMsg];
      setMessages(allMessages);

      setQuickReplies(parseQuickReplies(data.message));

      const brief = parseBrief(data.message);
      if (brief) {
        if (variants) {
          const v = variants[brief.suggestedVariantId];
          if (v) setEstimatedCost(v.creditCost);
        }
        onBriefGenerated(brief, allMessages);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: t("common.connectionError") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input.trim());
    }
  };

  const visibleMessages = messages.filter((m) => !m.hidden);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(245,246,252,0.06)] text-xs text-[rgba(245,246,252,0.5)]">
        <span>Estimate: {estimatedCost ? `${estimatedCost} credits` : "pending"}</span>
      </div>

      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-none px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[var(--gold-bar)] text-[var(--asphalt-black)]"
                  : "bg-[#1a1a1a] text-[var(--ice-white)] border border-[rgba(245,246,252,0.08)]"
              }`}
            >
              {msg.role === "assistant" ? stripMeta(msg.content) : msg.content}
              {msg.role === "assistant" &&
                (msg.content.includes("facturación") || msg.content.includes("billing")) && (
                  <a
                    href="/billing"
                    className="inline-block mt-2 text-xs text-[var(--gold-bar)] hover:underline"
                  >
                    Go to billing →
                  </a>
                )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] rounded-none border border-[rgba(245,246,252,0.08)]">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      {quickReplies.length > 0 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => sendMessage(reply)}
              className="px-3 py-1.5 text-xs border border-[var(--gold-bar)] text-[var(--gold-bar)] hover:bg-[var(--gold-bar)] hover:text-[var(--asphalt-black)] transition-colors rounded-none"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[rgba(245,246,252,0.1)] p-4"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:border-[var(--gold-bar)]"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
