"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { Send, Mail } from "lucide-react";
import { MessageList, type DirectMessageView } from "@/components/messages/message-list";

interface PmInfo {
  id: string;
  name: string;
  email: string;
}

export function ClientMessagesView({
  pm,
  initialMessages,
}: {
  pm: PmInfo | null;
  initialMessages: DirectMessageView[];
}) {
  const { t } = useTranslation();
  const session = useSession();
  const viewerId = (session.data?.user?.id as string) || "";
  const [messages, setMessages] = useState<DirectMessageView[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const markedRef = useRef(false);

  // Mark as read once on mount
  useEffect(() => {
    if (!pm || markedRef.current) return;
    markedRef.current = true;
    fetch(`/api/messages/${pm.id}/read`, { method: "PATCH" }).catch(() => {});
  }, [pm]);

  if (!pm) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          {t("messages.title")}
        </h1>
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          <CardContent className="py-12 text-center">
            <Mail className="h-10 w-10 text-[rgba(245,246,252,0.3)] mx-auto mb-3" />
            <p className="text-sm text-[rgba(245,246,252,0.6)]">{t("messages.noPm")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${pm.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to send");
        return;
      }
      const data = await res.json();
      setMessages((prev: DirectMessageView[]) => [...prev, data.message]);
      setDraft("");
      toast.success(t("messages.sent"));
    } catch {
      toast.error("Connection error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
          {t("messages.title")}
        </h1>
        <p className="mt-1 text-sm text-[rgba(245,246,252,0.5)]">
          {t("messages.with")} <span className="text-[var(--ice-white)] font-medium">{pm.name}</span>
        </p>
      </div>

      <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
        <CardHeader>
          <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
            {t("messages.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MessageList messages={messages} viewerId={viewerId} otherName={pm.name} emptyText={t("messages.emptyClient")} />

          <div className="mt-4 space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              placeholder={t("messages.placeholder")}
              rows={3}
              className="w-full rounded-md border border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] resize-y focus:outline-none focus:border-[var(--gold-bar)]"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[rgba(245,246,252,0.4)]">{draft.length}/2000</span>
              <Button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? "..." : t("messages.send")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
