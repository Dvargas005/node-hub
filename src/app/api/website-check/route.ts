import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { CheckInputError, runWebsiteCheck } from "@/lib/website-check";

// Public, no login: this is the free tool on /free-website-check.
// PageSpeed alone can take 40s, so the default function timeout is too short.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // In-memory, so per instance. Enough to stop one visitor from turning the
  // checker into a request cannon against someone else's site.
  if (!checkRateLimit(`website-check:${ip}`, 6, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You have run a lot of checks. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  }
  if (typeof url !== "string") {
    return NextResponse.json({ error: "Enter a website address." }, { status: 400 });
  }

  try {
    const report = await runWebsiteCheck(url);
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof CheckInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EBLOCKED") {
      return NextResponse.json({ error: "That address points to a private network and cannot be checked." }, { status: 400 });
    }
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
      return NextResponse.json({ error: "We could not find that domain. Check the spelling." }, { status: 400 });
    }
    console.error("[WEBSITE_CHECK]", code ?? "", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "We could not load that site. It may be down, very slow, or blocking automated checks." },
      { status: 502 },
    );
  }
}
