import "server-only";
import { randomBytes } from "crypto";

/** Opaque, unguessable token for the public signing link. */
export function genAgreementToken(): string {
  return randomBytes(24).toString("hex");
}

/** Split a free-text deliverable brief into concrete line items. */
export function parseDeliverables(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n|;|•|·|•/)
    .map((s) => s.replace(/^[-*\d.\)\s]+/, "").trim())
    .filter((s) => s.length > 1)
    .slice(0, 25);
}

/** Standard "how it will be provided" clause. */
export const DEFAULT_METHOD =
  "Delivered through your N.O.D.E. dashboard: files, updates and revision rounds are posted to this request, and all communication happens in the request thread. You review each delivery and either approve it or request adjustments.";

export type AgreementDraft = {
  title: string;
  scope: string;
  deliverables: string[];
  method: string;
  timelineDays: number;
  targetDate: Date;
  priceCredits: number;
};

/** Compose a draft agreement from a ticket's service variant + brief. */
export function composeDraft(opts: {
  serviceName: string;
  variantName: string;
  variantDescription: string;
  estimatedDays: number;
  priceCredits: number;
  briefDeliverable?: unknown;
  from?: Date;
}): AgreementDraft {
  const from = opts.from ?? new Date();
  const targetDate = new Date(from.getTime() + opts.estimatedDays * 86_400_000);
  const fromBrief = parseDeliverables(opts.briefDeliverable);
  const deliverables = fromBrief.length > 0 ? fromBrief : [opts.variantDescription];
  return {
    title: `${opts.serviceName} — ${opts.variantName}`,
    scope: opts.variantDescription,
    deliverables,
    method: DEFAULT_METHOD,
    timelineDays: opts.estimatedDays,
    targetDate,
    priceCredits: opts.priceCredits,
  };
}
