import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface WaitlistEntry {
  name: string;
  email: string;
  businessName?: string;
  allianceCode?: string;
  language: "es" | "en";
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

async function readEntries(): Promise<WaitlistEntry[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeEntries(entries: WaitlistEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

function buildEntry(
  name: string,
  email: string,
  businessName?: string,
  allianceCode?: string,
  lang: "es" | "en" = "es"
): WaitlistEntry {
  return {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    businessName: businessName?.trim() || undefined,
    allianceCode: allianceCode?.trim() || undefined,
    language: lang,
    createdAt: new Date().toISOString(),
  };
}

async function handleKV(
  name: string,
  email: string,
  businessName?: string,
  allianceCode?: string,
  lang: "es" | "en" = "es"
): Promise<NextResponse | null> {
  try {
    // Dynamic import so build doesn't fail without @vercel/kv
    const mod = await (Function('return import("@vercel/kv")')() as Promise<{ kv: any }>);
    const { kv } = mod;

    const existing = await kv.get(`waitlist:${email.toLowerCase().trim()}`);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const entry = buildEntry(name, email, businessName, allianceCode, lang);
    await kv.set(`waitlist:${entry.email}`, JSON.stringify(entry));
    await kv.lpush("waitlist:emails", entry.email);

    return NextResponse.json({ success: true });
  } catch {
    return null; // KV not available, fall through to JSON file
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, businessName, allianceCode, language } = body;

    // Name is optional — derive from email if not provided
    const resolvedName =
      name && typeof name === "string" && name.trim().length > 0
        ? name
        : email?.split("@")[0] || "Subscriber";

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const lang = language === "en" ? "en" : "es";

    // Try Vercel KV first
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const kvResult = await handleKV(resolvedName, email, businessName, allianceCode, lang);
      if (kvResult) return kvResult;
    }

    // Fallback: JSON file storage
    const entries = await readEntries();
    const duplicate = entries.find(
      (e) => e.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const entry = buildEntry(resolvedName, email, businessName, allianceCode, lang);
    entries.push(entry);
    await writeEntries(entries);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
