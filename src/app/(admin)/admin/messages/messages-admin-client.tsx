"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle } from "lucide-react";
import { MessageList, type DirectMessageView } from "@/components/messages/message-list";

export interface ConversationItem {
  userId: string;
  name: string;
  businessName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface SelectedTarget {
  id: string;
  name: string;
  businessName: string | null;
}

export function AdminMessagesView({
  conversations,
  viewerId,
}: {
  conversations: ConversationItem[];
  viewerId: string;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [messages, setMessages] = useState<DirectMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [convList, setConvList] = useState<ConversationItem[]>(conversations);

  const handleSelect = async (c: ConversationItem) => {
    setSelected({ id: c.userId, name: c.name, businessName: c.businessName });
    setLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/messages/${c.userId}`);
      if (!res.ok) {
        toast.error(t("common.failedToLoad"));
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
      // Mark as read
      await fetch(`/api/messages/${c.userId}/read`, { method: "PATCH" });
      // Locally clear unread badge
      setConvList((prev: ConversationItem[]) =>
        prev.map((x: ConversationItem) => (x.userId === c.userId ? { ...x, unreadCount: 0 } : x)),
      );
    } catch {
      toast.error(t("common.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selected) return;
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t("common.failedToSend"));
        return;
      }
      const data = await res.json();
      setMessages((prev: DirectMessageView[]) => [...prev, data.message]);
      setDraft("");
      toast.success(t("messages.sent"));
      // Update last message preview in list
      setConvList((prev: ConversationItem[]) =>
        prev.map((x: ConversationItem) =>
          x.userId === selected.id
            ? { ...x, lastMessage: content, lastMessageAt: data.message.createdAt }
            : x,
        ),
      );
    } catch {
      toast.error(t("common.connectionError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-[var(--font-lexend)] text-2xl font-bold text-[var(--ice-white)]">
        {t("messages.title")}
      </h1>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Left: conversations list */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)] md:max-h-[calc(100vh-10rem)] md:overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
              {t("messages.conversations")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:overflow-y-auto md:max-h-[calc(100vh-14rem)]">
            {convList.length === 0 && (
              <div className="py-12 px-4 text-center text-sm text-[rgba(245,246,252,0.4)]">
                {t("messages.emptyPm")}
              </div>
            )}
            {convList.map((c: ConversationItem) => (
              <button
                key={c.userId}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-4 py-3 border-b border-[rgba(245,246,252,0.06)] hover:bg-[rgba(255,255,255,0.04)] transition-colors ${
                  selected?.id === c.userId ? "bg-[rgba(255,201,25,0.06)] border-l-2 border-l-[var(--gold-bar)]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-sm font-medium text-[var(--ice-white)] truncate">{c.name}</span>
                  {c.unreadCount > 0 && (
                    <Badge className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] text-[10px] font-bold shrink-0">
                      {c.unreadCount}
                    </Badge>
                  )}
                </div>
                {c.businessName && (
                  <p className="text-[10px] text-[rgba(245,246,252,0.4)] truncate">{c.businessName}</p>
                )}
                {c.lastMessage ? (
                  <p className="text-xs text-[rgba(245,246,252,0.5)] truncate mt-0.5">
                    {c.lastMessage.slice(0, 50)}
                    {c.lastMessage.length > 50 ? "…" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-[rgba(245,246,252,0.3)] mt-0.5 italic">—</p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Right: selected conversation */}
        <Card className="border-[rgba(245,246,252,0.1)] bg-[rgba(255,255,255,0.03)]">
          {!selected ? (
            <CardContent className="py-20 text-center">
              <MessageCircle className="h-10 w-10 text-[rgba(245,246,252,0.3)] mx-auto mb-3" />
              <p className="text-sm text-[rgba(245,246,252,0.5)]">{t("messages.emptyPm")}</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="font-[var(--font-lexend)] text-[var(--ice-white)] text-base">
                  {selected.name}
                </CardTitle>
                {selected.businessName && (
                  <p className="text-xs text-[rgba(245,246,252,0.5)]">{selected.businessName}</p>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-12 text-center text-sm text-[rgba(245,246,252,0.4)]">Loading...</div>
                ) : (
                  <MessageList
                    messages={messages}
                    viewerId={viewerId}
                    otherName={selected.name}
                    emptyText={t("messages.empty")}
                  />
                )}

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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
