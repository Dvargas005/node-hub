"use client";

import { useTranslation } from "@/hooks/useTranslation";

export interface DirectMessageView {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}

interface Props {
  messages: DirectMessageView[];
  viewerId: string;
  otherName: string;
  emptyText?: string;
}

export function MessageList({ messages, viewerId, otherName, emptyText }: Props) {
  const { t } = useTranslation();

  if (messages.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[rgba(245,246,252,0.4)]">
        {emptyText || t("messages.empty")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[rgba(245,246,252,0.06)]">
      {messages.map((msg: DirectMessageView) => {
        const isMine = msg.senderId === viewerId;
        const isUnread = !msg.read && !isMine;
        return (
          <div
            key={msg.id}
            className={`py-3 px-2 ${isUnread ? "border-l-2 border-[var(--gold-bar)] bg-[rgba(255,201,25,0.04)] pl-3" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--ice-white)]">
                {isMine ? t("messages.you") : otherName}
              </span>
              <span className="text-[10px] text-[rgba(245,246,252,0.4)]">{timeAgo(msg.createdAt)}</span>
            </div>
            <p className="text-sm text-[rgba(245,246,252,0.85)] whitespace-pre-wrap break-words">
              {msg.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
