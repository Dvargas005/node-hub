import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { getGeminiModel } from "@/lib/gemini";
import { lookup } from "dns/promises";

export async function POST(req: NextRequest) {
  const { error } = await requireApiRole(["CLIENT"]);
  if (error) return error;

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;

    // SSRF protection
    try {
      const parsed = new URL(fullUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL inválida", partial: true });
      }
      const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "[::1]"];
      if (blocked.some((b) => parsed.hostname.includes(b))) {
        return NextResponse.json({ error: "URL no permitida", partial: true });
      }
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsed.hostname)) {
        return NextResponse.json({ error: "URL no permitida", partial: true });
      }
      // S4: DNS rebinding protection — resolve hostname and check IP
      try {
        const { address } = await lookup(parsed.hostname);
        const isPrivate = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(address);
        if (isPrivate) {
          return NextResponse.json({ error: "URL no permitida", partial: true });
        }
      } catch {
        // DNS resolution failed — hostname doesn't exist
        return NextResponse.json({ error: "No se pudo resolver la URL", partial: true });
      }
    } catch {
      return NextResponse.json({ error: "URL inválida", partial: true });
    }

    // Fetch website content
    let html: string;
    try {
      const res = await fetch(fullUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NODEBot/1.0; +https://node.nouvos.one)",
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10000),
        redirect: "follow",
      });
      const rawText = await res.text();
      html = rawText.substring(0, 50000);
    } catch (fetchErr) {
      console.error("[ANALYZE_URL] Fetch failed:", fetchErr);
      return NextResponse.json({
        error: "No pude acceder a esa URL",
        partial: true,
      });
    }

    // Strip HTML to text (basic)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    // Extract meta tags
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);

    const metaContext = [
      titleMatch?.[1] ? `Título: ${titleMatch[1]}` : "",
      descMatch?.[1] ? `Meta descripción: ${descMatch[1]}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const model = getGeminiModel();

    const prompt = `Analiza este sitio web y extrae información del negocio.

${metaContext}

Contenido del sitio (primeros 3000 chars):
${text}

Responde SOLO con un JSON válido, sin texto adicional:
{
  "businessName": "nombre del negocio si lo encuentras",
  "businessDescription": "descripción corta del negocio en 1 oración",
  "businessIndustry": "industria (una de: Restaurante, Tienda / Retail, Servicios profesionales, Salud / Bienestar, Tecnología, Educación, Eventos, Construcción, Transporte, Otro)",
  "targetAudience": "público objetivo si puedes inferirlo",
  "brandColors": "colores principales del sitio si son evidentes",
  "brandStyle": "estilo visual (Minimalista, Bold, Elegante, Moderno, Clásico, Divertido, Corporativo)"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "No pude analizar el sitio", partial: true });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ data: parsed, url: fullUrl });
  } catch (err) {
    console.error("[ANALYZE_URL]", err);
    return NextResponse.json({ error: "Error al analizar la URL", partial: true });
  }
}
