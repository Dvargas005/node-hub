"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Mail, Phone, MessageCircle, Send as SendIcon, Linkedin, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactInfo {
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  telegramId: string | null;
  linkedinUrl: string | null;
  instagramHandle: string | null;
  preferredContact: string | null;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

function whatsappLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function telegramLink(raw: string): string {
  const handle = raw.replace(/^@/, "").trim();
  return `https://t.me/${handle}`;
}

function linkedinLink(raw: string): string {
  if (raw.match(/^https?:\/\//)) return raw;
  return `https://${raw}`;
}

function instagramLink(raw: string): string {
  const handle = raw.replace(/^@/, "").trim();
  return `https://instagram.com/${handle}`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="text-[rgba(245,246,252,0.3)] hover:text-[var(--gold-bar)] transition-colors p-1"
      aria-label={copied ? t("contact.copied") : t("contact.copy")}
      title={copied ? t("contact.copied") : t("contact.copy")}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

interface RowProps {
  icon: React.ReactNode;
  href: string;
  label: string;
  copyValue: string;
  external?: boolean;
}
function Row({ icon, href, label, copyValue, external }: RowProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[rgba(245,246,252,0.4)]">{icon}</span>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-[rgba(245,246,252,0.7)] hover:text-[var(--gold-bar)] transition-colors truncate flex-1"
      >
        {label}
      </a>
      {external && <ExternalLink className="h-3 w-3 text-[rgba(245,246,252,0.3)]" />}
      <CopyButton value={copyValue} />
    </div>
  );
}

export function ContactBlock({ contact }: { contact: ContactInfo }) {
  const { t } = useTranslation();
  const preferredLabel: Record<string, string> = {
    email: t("contact.method.email"),
    phone: t("contact.method.phone"),
    whatsapp: t("contact.method.whatsapp"),
    telegram: t("contact.method.telegram"),
  };

  const hasAny =
    contact.email ||
    contact.phone ||
    contact.whatsappNumber ||
    contact.telegramId ||
    contact.linkedinUrl ||
    contact.instagramHandle;

  if (!hasAny) {
    return <p className="text-xs text-[rgba(245,246,252,0.3)]">—</p>;
  }

  return (
    <div className="space-y-1.5">
      {contact.preferredContact && (
        <Badge className="bg-[var(--gold-bar)]/15 text-[var(--gold-bar)] border-[var(--gold-bar)]/30 text-[10px] gap-1">
          ⭐ {preferredLabel[contact.preferredContact] || contact.preferredContact}
        </Badge>
      )}
      {contact.email && (
        <Row
          icon={<Mail className="h-3 w-3" />}
          href={`mailto:${contact.email}`}
          label={contact.email}
          copyValue={contact.email}
        />
      )}
      {contact.phone && (
        <Row
          icon={<Phone className="h-3 w-3" />}
          href={`tel:${normalizePhone(contact.phone)}`}
          label={contact.phone}
          copyValue={contact.phone}
        />
      )}
      {contact.whatsappNumber && (
        <Row
          icon={<MessageCircle className="h-3 w-3" />}
          href={whatsappLink(contact.whatsappNumber)}
          label={contact.whatsappNumber}
          copyValue={contact.whatsappNumber}
          external
        />
      )}
      {contact.telegramId && (
        <Row
          icon={<SendIcon className="h-3 w-3" />}
          href={telegramLink(contact.telegramId)}
          label={contact.telegramId}
          copyValue={contact.telegramId}
          external
        />
      )}
      {contact.linkedinUrl && (
        <Row
          icon={<Linkedin className="h-3 w-3" />}
          href={linkedinLink(contact.linkedinUrl)}
          label={contact.linkedinUrl}
          copyValue={contact.linkedinUrl}
          external
        />
      )}
      {contact.instagramHandle && (
        <Row
          icon={<Instagram className="h-3 w-3" />}
          href={instagramLink(contact.instagramHandle)}
          label={contact.instagramHandle}
          copyValue={contact.instagramHandle}
          external
        />
      )}
    </div>
  );
}

export function ContactIcons({ contact }: { contact: ContactInfo }) {
  // Compact icon row for tables
  const items: { href: string; icon: React.ReactNode; title: string; external?: boolean }[] = [];
  if (contact.email) items.push({ href: `mailto:${contact.email}`, icon: <Mail className="h-3.5 w-3.5" />, title: contact.email });
  if (contact.phone) items.push({ href: `tel:${normalizePhone(contact.phone)}`, icon: <Phone className="h-3.5 w-3.5" />, title: contact.phone });
  if (contact.whatsappNumber) items.push({ href: whatsappLink(contact.whatsappNumber), icon: <MessageCircle className="h-3.5 w-3.5" />, title: contact.whatsappNumber, external: true });
  if (contact.telegramId) items.push({ href: telegramLink(contact.telegramId), icon: <SendIcon className="h-3.5 w-3.5" />, title: contact.telegramId, external: true });
  if (contact.linkedinUrl) items.push({ href: linkedinLink(contact.linkedinUrl), icon: <Linkedin className="h-3.5 w-3.5" />, title: contact.linkedinUrl, external: true });
  if (contact.instagramHandle) items.push({ href: instagramLink(contact.instagramHandle), icon: <Instagram className="h-3.5 w-3.5" />, title: contact.instagramHandle, external: true });

  if (items.length === 0) return <span className="text-[rgba(245,246,252,0.3)]">—</span>;

  return (
    <div className="flex items-center gap-1.5">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          title={item.title}
          className="text-[rgba(245,246,252,0.5)] hover:text-[var(--gold-bar)] transition-colors"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
