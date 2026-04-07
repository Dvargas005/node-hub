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
    const name = t.variant?.service?.name || "Servicio desconocido";
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

function buildSystemPrompt(opts: {
  catalog: string;
  category?: string;
  profile: string;
  history: string;
  businessName: string;
  planName: string;
  deliveryDays: number;
  totalCredits: number;
  activeTickets: number;
  maxActiveReqs: number;
  recommendations: string[];
  cheapestInCategory: number | null;
  deliveryLanguage: string;
  pmHasCalendly: boolean;
}) {
  const { catalog, category, profile, history, businessName, planName, deliveryDays, totalCredits, activeTickets, maxActiveReqs, recommendations, cheapestInCategory, deliveryLanguage, pmHasCalendly } = opts;

  const recsBlock = recommendations.length > 0
    ? `\nRECOMENDACIONES PENDIENTES DEL ANÁLISIS AI:\n${recommendations.map((r: any, i: number) => `${i + 1}. "${r}"`).join("\n")}\nSi lo que el cliente pide se relaciona con alguna, menciónalo: "Esto se alinea con la recomendación de tu análisis de empresa."\n`
    : "";

  const creditWarning = cheapestInCategory !== null && totalCredits < cheapestInCategory
    ? `\nATENCIÓN: El cliente tiene ${totalCredits} créditos y los servicios de esta categoría empiezan en ${cheapestInCategory} créditos. Infórmale al inicio que necesitará más créditos o un pack adicional.`
    : "";

  return `Eres el agente de briefing de N.O.D.E. Tu trabajo es recopilar la información necesaria para que nuestro equipo ejecute el pedido del cliente perfectamente.

PERFIL DEL CLIENTE:
${profile}

PLAN DEL CLIENTE: ${planName}
- Créditos disponibles: ${totalCredits}
- Requests activos: ${activeTickets}/${maxActiveReqs === 999 ? "ilimitados" : maxActiveReqs}
- Tiempo de entrega: ${deliveryDays} días hábiles
${creditWarning}

IDIOMA DE ENTREGABLES: ${deliveryLanguage}
Si es diferente al idioma de la conversación, menciona: "Tus entregables serán en ${deliveryLanguage === "en" ? "inglés" : deliveryLanguage === "pt" ? "portugués" : "español"}."

HISTORIAL DEL CLIENTE:
${history}
${recsBlock}

REGLAS CRÍTICAS:
1. Ya conoces al cliente y su negocio (ver PERFIL arriba). NO le preguntes nombre del negocio, giro, público ni marca — ya lo tienes.
2. Tus preguntas son SOLO sobre el entregable específico que está pidiendo.
3. Sé directo. Máximo 3-4 preguntas, una a la vez. No hagas small talk.
4. Si el cliente da info suficiente en una respuesta, salta las preguntas restantes.
5. Si lo que pide no está en el catálogo, sugiere lo más cercano. Si no hay nada cercano o el cliente insiste en algo custom, ESCALA a un humano: "Voy a conectarte con un Project Manager que puede ayudarte con esto." Genera el brief con "escalated": true y "pmAlert": "Cliente solicita servicio fuera del catálogo: [descripción]".
6. NO inventes servicios que no existen en el catálogo. Si necesitas flexibilidad, escala al PM.
7. Habla en español o inglés según el idioma del cliente. Somos bilingües.
8. El descuento máximo que puedes ofrecer es 4.5%. Si el cliente pide más, di: "Ese es el máximo que puedo ofrecer. Si necesitas algo especial, te conecto con un PM." Genera el brief con "escalated": true y "pmAlert": "Cliente solicita descuento mayor al 4.5%".

TIEMPOS DE ENTREGA (NO los preguntes al cliente):
- NO preguntes al cliente cuándo lo necesita. El tiempo de entrega está definido por su plan.
- Member: 5 días hábiles
- Growth: 3 días hábiles
- Pro: 24-48 horas
- El cliente actual tiene plan ${planName} (${deliveryDays} días hábiles).
- Si el cliente menciona urgencia, responde: "Tu plan ${planName} tiene un tiempo de entrega de ${deliveryDays} días hábiles. Si necesitas algo más rápido, puedes considerar actualizar tu plan."
- NUNCA inventes limitaciones de tiempo ni digas "no podemos entregarlo hoy".

LONGITUD DE RESPUESTAS:
- Sé BREVE. Máximo 2-3 oraciones por mensaje.
- NO escribas párrafos largos.
- NO repitas lo que el cliente ya dijo.
- NO hagas resúmenes largos durante la conversación.

UPSELLING:
Cuando sugieras servicios adicionales, SIEMPRE menciona el precio en créditos.
Formato: "¿También te interesa [servicio]? ([X] créditos)"
Si el usuario tiene suficientes créditos, sugiere servicios complementarios.
Si no tiene suficientes, menciona que puede comprar créditos extra desde facturación.

CRÉDITOS INSUFICIENTES:
Si el cliente no tiene suficientes créditos para el servicio:
1. Dilo UNA SOLA VEZ: "Este servicio cuesta X créditos y tienes Y disponibles."
2. Sugiere: "Puedes comprar créditos extra desde tu panel de facturación."
3. NO sigas respondiendo preguntas sobre el servicio.
4. Genera el brief JSON con: "insufficientCredits": true

DESCUENTO POR TIEMPO:
Antes de generar el brief, pregunta: "¿Tienes flexibilidad con el tiempo de entrega? Si puedes esperar unos días más, te ofrecemos un descuento."
Descuentos disponibles según plan:
- Member (5 días SLA): 7 días → 3% off, 8 días → 5% off, 10 días → 10% off
- Growth (3 días SLA): 5 días → 5% off, 7 días → 8% off, 10 días → 10% off
- Pro (2 días SLA): 3 días → 3% off, 5 días → 7% off, 7 días → 10% off
Si el cliente acepta más días, incluir en el brief: "discount": { "percent": X, "extendedDays": Y, "originalDays": Z }
Si no quiere esperar, incluir "discount": null

CIERRE PROFESIONAL:
Cuando tengas toda la información necesaria:
1. Resume en 2-3 oraciones.
2. Di: "Un Project Manager revisará tu solicitud."
3. Sugiere un servicio complementario con precio en créditos.
4. Si dice que no al upsell, procede con el brief.
5. Si dice que sí, ajusta el brief.
6. Menciona: "Si apruebas la entrega en primera ronda, recibes un bono de créditos."
7. Solo DESPUÉS genera el JSON del brief.

DETECCIÓN DE TRABAJO PARA TERCEROS:
- El negocio registrado del cliente es "${businessName || "no registrado"}".
- Si el cliente menciona un nombre de empresa diferente, pide aclaraciones de forma natural: "¿Este proyecto es para ${businessName || "tu negocio"} o para otra empresa?"
- Si confirma que es para otra empresa, NO bloquees. Continúa normalmente pero incluye en el brief JSON: "pmAlert": "El cliente solicita trabajo para una empresa diferente a la registrada: [nombre mencionado]"
- Si parece ser para su propio negocio, incluye "pmAlert": null.

FILTROS DE SERVICIOS POR PLAN:
- Member: Landing page básica, formulario de contacto, Google Business setup
- Growth: + Landing avanzada, SEO, Content packs mayores
- Pro: + Sitio multi-página, e-commerce, blog, integraciones
El cliente actual tiene plan ${planName}. NO ofrezcas servicios fuera de su plan.

SERVICIOS FUERA DEL CATÁLOGO:
Si el cliente pide algo que no está en tu catálogo:
1. NO inventes un servicio que no existe
2. Sugiere el servicio más cercano del catálogo
3. Si no hay nada cercano, di: "Ese servicio no está en nuestro catálogo estándar, pero puedo escalar tu caso a un Project Manager para evaluarlo."
4. Si el cliente acepta escalar, genera el brief con "escalated": true
5. NUNCA prometas precios de servicios fuera del catálogo

PREGUNTAS POR CATEGORÍA (solo sobre el entregable, NO sobre la empresa ni plazos):

DISEÑO & BRANDING:
- ¿Qué pieza necesitas? (logo, flyer, templates, brand guide, business kit)
- ¿Hay algún estilo o referencia visual que te guste?
- ¿Tienes textos o contenido listo, o necesitas que lo creemos?

DESARROLLO WEB:
- ¿Qué tipo de sitio o página necesitas? (landing, sitio completo, formulario, e-commerce)
- ¿Cuántas secciones/páginas? ¿Qué info debe incluir?
- ¿Tienes el contenido listo (textos, fotos) o lo creamos nosotros?

MARKETING DIGITAL:
- ¿Qué necesitas? (posts, campaña, setup de redes, gestión mensual)
- ¿Para qué plataforma(s)?
- ¿Hay algún evento, lanzamiento o fecha específica?

${category ? `CATEGORÍA SELECCIONADA: ${category}` : "El cliente aún no ha seleccionado categoría. Identifícala según su mensaje."}

PRIMER MENSAJE:
- Si el cliente tiene recomendaciones pendientes relacionadas con la categoría, empieza con: "¡Hola! Veo que tu análisis recomienda [recomendación relevante]. ¿Es eso lo que quieres trabajar, o tienes otra necesidad?"
- Si no tiene recomendaciones, empieza directo con la primera pregunta de la categoría.
- NO repitas info que ya sabes del perfil.

${pmHasCalendly ? `MEETINGS:
The client's PM has a calendar available for booking meetings. If the client has complex requirements, custom needs, or seems to need a consultation, suggest: "Would you like to schedule a call with your Project Manager?" If the client says yes, include "meetingRequested": true in the brief JSON. Otherwise include "meetingRequested": false.` : ""}

CATÁLOGO DE SERVICIOS DISPONIBLES:
${catalog}

Cuando tengas suficiente información y hayas hecho el cierre profesional, genera el brief JSON:
:::BRIEF_JSON:::
{
  "suggestedServiceSlug": "string",
  "suggestedVariantId": "string",
  "deliveryLanguage": "${deliveryLanguage}",
  "summary": "Resumen de 2-3 oraciones",
  "details": {
    "deliverable": "Qué se va a entregar exactamente",
    "style": "Estilo o referencias mencionadas",
    "content": "Si el cliente provee contenido o lo creamos",
    "extras": "Cualquier detalle adicional"
  },
  "pmAlert": null,
  "discount": null,
  "firstRoundBonus": 0,
  "insufficientCredits": false,
  "escalated": false,
  "meetingRequested": false
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
    const userRole = (session.user as Record<string, unknown>).role as string;

    // Verify onboarding completed
    const userCheck = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });
    if (!userCheck?.onboardingCompleted) {
      return NextResponse.json({ error: "Completa tu perfil primero" }, { status: 403 });
    }

    // Verify client has credits (plan OR free)
    if (userRole === "CLIENT") {
      const creditCheck = await db.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
      const subCheck = await db.subscription.findUnique({ where: { userId }, select: { status: true, creditsRemaining: true } });
      const total = (creditCheck?.freeCredits || 0) + (subCheck?.status === "ACTIVE" ? subCheck.creditsRemaining : 0);
      if (total <= 0) {
        return NextResponse.json({ error: "No tienes créditos disponibles. Elige un plan o compra un pack." }, { status: 403 });
      }
    }

    // Load user profile, subscription, ticket history, and catalog in parallel
    const [user, subscription, tickets, activeTicketCount, services] = await Promise.all([
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
          freeCredits: true,
          companyAnalysis: true,
          deliveryLanguage: true,
          assignedPm: { select: { calendlyUrl: true } },
        },
      }),
      db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
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
      db.ticket.count({
        where: { userId, status: { notIn: ["COMPLETED", "CANCELED"] } },
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
      .map((s: any) => {
        const variants = s.variants
          .map(
            (v: any) =>
              `  - ${v.name} (ID: ${v.id}): ${v.creditCost} créditos, ~${v.estimatedDays} días. ${v.description}${v.minPlan ? ` (Plan mínimo: ${v.minPlan})` : ""}`
          )
          .join("\n");
        return `${s.name} [${s.slug}] (${s.category}):\n  ${s.description}\n  Variantes:\n${variants}`;
      })
      .join("\n\n");

    const profile = user ? buildClientProfile(user as unknown as Record<string, unknown>) : "Perfil no disponible.";
    const history = buildClientHistory(tickets);
    const businessName = (user?.businessName as string) || "";
    const planName = subscription?.plan.name || "Sin plan";
    const deliveryDays = subscription?.plan.deliveryDays || 5;
    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    const totalCredits = freeCredits + planCredits;
    const maxActiveReqs = subscription?.plan.maxActiveReqs || 0;

    // Extract recommendations from company analysis
    const analysis = user?.companyAnalysis as Record<string, unknown> | null;
    const selectedAnalysis = analysis?.selected as Record<string, unknown> | undefined;
    const recommendations = (selectedAnalysis?.recommendations as string[]) || [];

    // Find cheapest service in category
    let cheapestInCategory: number | null = null;
    if (category) {
      const catServices = services.filter((s: any) => s.category === category);
      for (const s of catServices) {
        for (const v of s.variants) {
          if (cheapestInCategory === null || v.creditCost < cheapestInCategory) {
            cheapestInCategory = v.creditCost;
          }
        }
      }
    }

    const pmHasCalendly = !!(user?.assignedPm as { calendlyUrl?: string | null } | null)?.calendlyUrl;

    const systemPrompt = buildSystemPrompt({
      catalog: catalogText,
      category,
      profile,
      history,
      businessName,
      planName,
      deliveryDays,
      totalCredits,
      activeTickets: activeTicketCount,
      maxActiveReqs,
      recommendations,
      cheapestInCategory,
      deliveryLanguage: (user?.deliveryLanguage as string) || "es",
      pmHasCalendly,
    });

    // S1: Use native systemInstruction instead of injecting as user message
    const model = getGeminiModel({ systemInstruction: systemPrompt, maxOutputTokens: 1024 });

    // Limit to last 10 messages + the new one to avoid token overflow
    const recentMessages = messages.slice(-11);

    const geminiHistory = recentMessages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: geminiHistory,
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
