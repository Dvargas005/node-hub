import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";
import { getGeminiModel } from "@/lib/gemini";

function buildSystemPrompt(catalog: string, category?: string) {
  return `Eres el asistente de N.O.D.E., una plataforma de servicios creativos digitales. Tu trabajo es ayudar al cliente a definir exactamente qué necesita para que nuestro equipo pueda ejecutarlo perfectamente.

CATÁLOGO DE SERVICIOS DISPONIBLES:
${catalog}

REGLAS:
1. Sé conversacional, amigable, profesional. Habla en español.
2. Haz máximo 3-4 preguntas de seguimiento, una a la vez.
3. Si el cliente ya dio suficiente info, no hagas más preguntas.
4. Sugiere el servicio y variante que mejor encaja.
5. Al final, genera un brief estructurado en formato JSON.
6. NUNCA inventes servicios que no están en el catálogo.
7. Si lo que pide no encaja con ningún servicio, sugiere el más cercano y aclara las limitaciones.
8. Si el cliente envía un mensaje muy corto o vago, haz preguntas para entender mejor.

${category ? `CATEGORÍA SELECCIONADA: ${category}` : "El cliente aún no ha seleccionado categoría. Identifícala según su mensaje."}

Cuando tengas suficiente información, responde EXACTAMENTE con este JSON al final de tu mensaje:

:::BRIEF_JSON:::
{
  "suggestedServiceSlug": "string (slug del servicio del catálogo)",
  "suggestedVariantId": "string (id de la variante sugerida)",
  "summary": "Resumen de lo que el cliente necesita en 2-3 oraciones",
  "details": {
    "objective": "Qué quiere lograr",
    "audience": "Para quién es",
    "style": "Estilo o preferencias mencionadas",
    "references": "Referencias o ejemplos mencionados",
    "deadline": "Si mencionó urgencia o fecha",
    "extras": "Cualquier detalle adicional"
  }
}
:::END_BRIEF:::`;
}

export async function POST(req: NextRequest) {
  const { error } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error) return error;

  try {
    const { messages, category } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    // Load catalog from DB
    const services = await db.service.findMany({
      where: { isActive: true },
      include: {
        variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

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

    const systemPrompt = buildSystemPrompt(catalogText, category);

    const model = getGeminiModel();

    // Build Gemini chat history
    const geminiHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Sistema: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Entendido. Estoy listo para ayudar al cliente a definir su solicitud." }] },
        ...geminiHistory,
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response.text();

    return NextResponse.json({ message: response });
  } catch (err) {
    console.error("[WIZARD_CHAT]", err);
    return NextResponse.json({ error: "Error al procesar la conversación" }, { status: 500 });
  }
}
