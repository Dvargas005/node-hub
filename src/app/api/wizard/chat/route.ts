import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { getGeminiModel } from "@/lib/gemini";

function buildClientProfile(user: Record<string, unknown>): string {
  const lines: string[] = [];
  if (user.businessName) lines.push(`- Negocio: ${user.businessName}${user.businessDescription ? " — " + user.businessDescription : ""}`);
  if (user.businessIndustry) lines.push(`- Industria: ${user.businessIndustry}`);
  if (user.targetAudience) lines.push(`- Público: ${user.targetAudience}`);
  if (user.hasBranding !== null && user.hasBranding !== undefined) {
    lines.push(`- Marca existente: ${user.hasBranding ? "Sí, colores: " + (user.brandColors || "no especificados") + ", estilo: " + (user.brandStyle || "no especificado") : "No tiene marca"}`);
  }
  lines.push(`- Sitio web: ${user.website || "No tiene"}`);
  if (user.socialMedia && typeof user.socialMedia === "object") {
    const sm = user.socialMedia as Record<string, string>;
    const formatted = Object.entries(sm).map(([k, v]) => `${k}: ${v}`).join(", ");
    if (formatted) lines.push(`- Redes: ${formatted}`);
  }
  return lines.length > 0 ? lines.join("\n") : "No completó su perfil aún.";
}

function buildClientHistory(tickets: { status: string; variant: { service: { name: string } } }[]): string {
  if (tickets.length === 0) return "Este es un cliente nuevo, sin historial de servicios.";

  const serviceCount: Record<string, { total: number; completed: number; inProgress: number }> = {};
  for (const t of tickets) {
    const name = t.variant.service.name;
    if (!serviceCount[name]) serviceCount[name] = { total: 0, completed: 0, inProgress: 0 };
    serviceCount[name].total++;
    if (t.status === "COMPLETED") serviceCount[name].completed++;
    else if (!["CANCELED"].includes(t.status)) serviceCount[name].inProgress++;
  }

  const lines = Object.entries(serviceCount).map(([name, c]) => {
    const parts = [];
    if (c.completed > 0) parts.push(`${c.completed} completado(s)`);
    if (c.inProgress > 0) parts.push(`${c.inProgress} en progreso`);
    return `- ${name}: ${parts.join(", ")}`;
  });

  return lines.join("\n");
}

function buildSystemPrompt(
  catalog: string,
  category: string | undefined,
  profile: string,
  history: string,
  businessName: string
) {
  return `Eres el agente de briefing de N.O.D.E. Tu trabajo es recopilar la información necesaria para que nuestro equipo ejecute el pedido del cliente perfectamente.

PERFIL DEL CLIENTE:
${profile}

HISTORIAL DEL CLIENTE:
${history}

REGLAS CRÍTICAS:
1. Ya conoces al cliente y su negocio (ver PERFIL arriba). NO le preguntes nombre del negocio, giro, público ni marca — ya lo tienes.
2. Tus preguntas son SOLO sobre el entregable específico que está pidiendo.
3. Sé directo. Máximo 3-4 preguntas, una a la vez. No hagas small talk.
4. Si el cliente da info suficiente en una respuesta, salta las preguntas restantes.
5. Si lo que pide no está en el catálogo, dile claramente qué es lo más cercano.
6. NUNCA inventes servicios que no están en el catálogo.
7. Cuando tengas toda la info, genera el brief JSON sin preguntar "¿algo más?"
8. Habla en español.

DETECCIÓN DE TRABAJO PARA TERCEROS:
- El negocio registrado del cliente es "${businessName || "no registrado"}".
- Si el cliente menciona un nombre de empresa diferente, pide aclaraciones de forma natural: "¿Este proyecto es para ${businessName || "tu negocio"} o para otra empresa?"
- Si confirma que es para otra empresa, NO bloquees. Continúa normalmente pero incluye en el brief JSON un campo extra: "pmAlert": "El cliente solicita trabajo para una empresa diferente a la registrada: [nombre mencionado]"
- Si parece ser para su propio negocio, incluye "pmAlert": null.

PREGUNTAS POR CATEGORÍA (solo sobre el entregable, NO sobre la empresa):

DISEÑO & BRANDING:
- ¿Qué pieza necesitas? (logo, flyer, templates, brand guide, business kit)
- ¿Hay algún estilo o referencia visual que te guste?
- ¿Tienes textos o contenido listo, o necesitas que lo creemos?
- ¿Para cuándo lo necesitas?

DESARROLLO WEB:
- ¿Qué tipo de sitio o página necesitas? (landing, sitio completo, formulario, e-commerce)
- ¿Cuántas secciones/páginas? ¿Qué info debe incluir?
- ¿Tienes el contenido listo (textos, fotos) o lo creamos nosotros?
- ¿Para cuándo lo necesitas?

MARKETING DIGITAL:
- ¿Qué necesitas? (posts, campaña, setup de redes, gestión mensual)
- ¿Para qué plataforma(s)?
- ¿Hay algún evento, lanzamiento o fecha específica?
- ¿Para cuándo lo necesitas?

${category ? `CATEGORÍA SELECCIONADA: ${category}` : "El cliente aún no ha seleccionado categoría. Identifícala según su mensaje."}

CATÁLOGO DE SERVICIOS DISPONIBLES:
${catalog}

Cuando tengas suficiente información, responde con tu recomendación y el brief JSON:
:::BRIEF_JSON:::
{
  "suggestedServiceSlug": "string",
  "suggestedVariantId": "string",
  "summary": "Resumen de 2-3 oraciones",
  "details": {
    "deliverable": "Qué se va a entregar exactamente",
    "style": "Estilo o referencias mencionadas",
    "content": "Si el cliente provee contenido o lo creamos",
    "deadline": "Urgencia o fecha",
    "extras": "Cualquier detalle adicional"
  },
  "pmAlert": null
}
:::END_BRIEF:::`;
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { messages, category } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    const userId = session.user.id;

    // Load user profile, ticket history, and catalog in parallel
    const [user, tickets, services] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          businessName: true,
          businessDescription: true,
          businessIndustry: true,
          targetAudience: true,
          hasBranding: true,
          brandColors: true,
          brandStyle: true,
          website: true,
          socialMedia: true,
        },
      }),
      db.ticket.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          variant: { select: { service: { select: { name: true } } } },
        },
      }),
      db.service.findMany({
        where: { isActive: true },
        include: {
          variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const catalogText = services
      .map((s) => {
        const variants = s.variants
          .map(
            (v) =>
              `  - ${v.name} (ID: ${v.id}): ${v.creditCost} créditos, ~${v.estimatedDays} días. ${v.description}${v.minPlan ? ` (Plan mínimo: ${v.minPlan})` : ""}`
          )
          .join("\n");
        return `${s.name} [${s.slug}] (${s.category}):\n  ${s.description}\n  Variantes:\n${variants}`;
      })
      .join("\n\n");

    const profile = user ? buildClientProfile(user as unknown as Record<string, unknown>) : "Perfil no disponible.";
    const history = buildClientHistory(tickets);
    const businessName = (user?.businessName as string) || "";

    const systemPrompt = buildSystemPrompt(catalogText, category, profile, history, businessName);

    const model = getGeminiModel();

    // Limit to last 10 messages + the new one to avoid token overflow
    const recentMessages = messages.slice(-11);

    const geminiHistory = recentMessages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Sistema: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido. Conozco el perfil del cliente y estoy listo para ayudarle con su solicitud." }] },
        ...geminiHistory,
      ],
    });

    const lastMessage = recentMessages[recentMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (err) {
    console.error("[WIZARD_CHAT]", err);
    return NextResponse.json({ error: "Error al procesar la conversación" }, { status: 500 });
  }
}
