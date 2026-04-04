"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BotBubble,
  UserBubble,
  TypingIndicator,
} from "@/components/onboarding/chat-bubble";
import { ChipSelector } from "@/components/onboarding/chip-selector";
import { StarRating } from "@/components/onboarding/star-rating";
import { UrlAnalyzer } from "@/components/onboarding/url-analyzer";
import { Send } from "lucide-react";

// ─── Types ──────────────────────────────────────────
interface OnboardingProfile {
  businessName?: string;
  businessIndustry?: string;
  businessDescription?: string;
  targetAudience?: string;
  hasBranding?: boolean | null;
  brandColors?: string;
  brandStyle?: string;
  website?: string;
  socialMedia?: Record<string, string>;
  priorities?: Record<string, number>;
}

type MsgType =
  | "text"
  | "chips"
  | "input"
  | "url"
  | "social-inputs"
  | "stars";

interface ChatMsg {
  id: string;
  role: "bot" | "user";
  content: string;
  type: MsgType;
  options?: string[];
  multiSelect?: boolean;
  answered?: boolean;
}

// ─── Static data ────────────────────────────────────
const industries = [
  "🍽️ Alimentos y Panadería",
  "🛍️ Retail / Tienda",
  "💼 Servicios Profesionales",
  "🏥 Salud y Terapia",
  "💻 Tecnología",
  "📚 Educación",
  "🎉 Eventos",
  "🏗️ Construcción",
  "🚚 Transporte",
  "🏠 Bienes Raíces",
  "🚗 Automotriz",
  "🧹 Limpieza y Mantenimiento",
  "💇 Belleza y Peluquería",
  "💪 Fitness y Gym",
  "⚖️ Legal",
  "✈️ Turismo y Hotelería",
  "🌾 Agricultura",
  "🔧 Otro",
];

const industrySubcategories: Record<string, string[]> = {
  "Alimentos y Panadería": ["Panadería artesanal", "Restaurante", "Food truck", "Catering", "Pastelería", "Cafetería", "Otro"],
  "Retail / Tienda": ["Boutique", "Tienda en línea", "Abarrotes", "Ferretería", "Joyería", "Otro"],
  "Servicios Profesionales": ["Abogado", "Contador", "Consultor", "Notaría", "Agencia", "Otro"],
  "Salud y Terapia": ["Consultorio médico", "Terapia física", "Nutrición", "Estética", "Dentista", "Otro"],
  "Tecnología": ["Desarrollo de software", "Soporte técnico", "SaaS", "E-commerce", "Otro"],
  "Educación": ["Academia", "Tutorías", "Cursos online", "Capacitación", "Otro"],
  "Eventos": ["Organizador de eventos", "Fotógrafo", "DJ / Música", "Banquetes", "Otro"],
  "Construcción": ["Contratista general", "Plomería", "Electricidad", "Pintura", "Arquitectura", "Otro"],
  "Transporte": ["Mudanzas", "Logística", "Paquetería", "Otro"],
  "Bienes Raíces": ["Agente inmobiliario", "Constructora", "Property management", "Otro"],
  "Automotriz": ["Taller mecánico", "Venta de autopartes", "Car wash", "Detailing", "Otro"],
  "Limpieza y Mantenimiento": ["Limpieza residencial", "Limpieza comercial", "Jardinería", "Otro"],
  "Belleza y Peluquería": ["Salón de belleza", "Barbería", "Estética", "Uñas", "Maquillaje", "Otro"],
  "Fitness y Gym": ["Gimnasio", "Entrenador personal", "Yoga / Pilates", "CrossFit", "Otro"],
  "Legal": ["Abogado general", "Inmigración", "Laboral", "Penal", "Otro"],
  "Turismo y Hotelería": ["Hotel", "Agencia de viajes", "Tour operador", "Restaurante turístico", "Otro"],
  "Agricultura": ["Cultivo", "Ganadería", "Agroindustria", "Vivero", "Otro"],
};

const audienceChips = [
  "👤 Consumidor final (B2C)",
  "🏢 Empresas (B2B)",
  "👥 Ambos",
  "👨‍👩‍👧‍👦 Familias",
  "👩‍💼 Profesionistas",
  "🌎 Comunidad local",
  "📱 Online / E-commerce",
];

const brandStyles = [
  "Minimalista", "Bold / Atrevido", "Elegante", "Moderno",
  "Clásico", "Divertido", "Corporativo",
];

// ─── Helpers ────────────────────────────────────────
function randDelay() {
  return 800 + Math.random() * 400;
}

function getPriorityAck(ratings: Record<string, number>): string {
  const max = Object.entries(ratings).sort(([, a], [, b]) => b - a)[0];
  const labels: Record<string, string> = {
    design: "el diseño es tu prioridad",
    web: "la presencia web es clave para ti",
    marketing: "el marketing es lo que más necesitas",
  };
  if (max && max[1] >= 4) {
    return `¡Veo que ${labels[max[0]] || max[0]}! Tenemos servicios perfectos para eso.`;
  }
  return "¡Buena combinación de prioridades!";
}

// ─── Component ──────────────────────────────────────
export function OnboardingClient({
  initialBusinessName,
}: {
  initialBusinessName: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>({
    businessName: initialBusinessName,
  });
  const [typing, setTyping] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [awaitingTextInput, setAwaitingTextInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  }, []);

  // ─── Message helpers with typing delay ──────────
  const pushBot = useCallback(
    (content: string, type: MsgType = "text", opts?: Partial<ChatMsg>) => {
      return new Promise<void>((resolve) => {
        setTyping(true);
        scroll();
        setTimeout(() => {
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            { id: `b-${Date.now()}-${Math.random()}`, role: "bot", content, type, ...opts },
          ]);
          scroll();
          resolve();
        }, randDelay());
      });
    },
    [scroll]
  );

  const pushUser = useCallback(
    (content: string) => {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content, type: "text" },
      ]);
      scroll();
    },
    [scroll]
  );

  const markAnswered = useCallback(() => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].role === "bot" && !copy[i].answered) {
          copy[i] = { ...copy[i], answered: true };
          break;
        }
      }
      return copy;
    });
  }, []);

  // ─── Sequenced bot messages (ack + question) ───
  const ackThenAsk = useCallback(
    async (ack: string, question: string, type: MsgType = "text", opts?: Partial<ChatMsg>) => {
      await pushBot(ack);
      await pushBot(question, type, opts);
    },
    [pushBot]
  );

  // ─── Step machine ─────────────────────────────────
  const advance = useCallback(
    async (nextStep: number) => {
      setStep(nextStep);

      switch (nextStep) {
        case 1:
          if (profile.businessName) {
            // Already have name from registration — skip to industry
            await pushBot(
              `¡Hola! 👋 Veo que tu negocio es ${profile.businessName}. Vamos a configurar tu perfil en menos de 2 minutos.`
            );
            await pushBot("¿En qué giro está tu negocio?", "chips", { options: industries });
            setStep(2);
            return;
          }
          await pushBot(
            "¡Hola! 👋 Soy el asistente de N.O.D.E. Vamos a configurar tu perfil en menos de 2 minutos."
          );
          await pushBot("¿Cómo se llama tu negocio?", "input");
          break;
        case 2:
          await pushBot("¿En qué giro está tu negocio?", "chips", { options: industries });
          break;
        case 3: {
          const subs = industrySubcategories[profile.businessIndustry || ""];
          if (subs) {
            await pushBot(
              "¿Cuál describe mejor tu negocio?",
              "chips",
              { options: subs }
            );
          } else {
            await pushBot("Cuéntame en una oración: ¿qué hace tu negocio?", "input");
          }
          break;
        }
        case 4:
          await pushBot(
            "¿Quién es tu cliente ideal?",
            "chips",
            { options: audienceChips, multiSelect: true }
          );
          break;
        case 5:
          await pushBot(
            "¿Tienes un sitio web? Puedo analizarlo para ahorrar tiempo.",
            "url"
          );
          break;
        case 6:
          await pushBot("¿Ya tienes logo o identidad visual?", "chips", {
            options: ["✅ Sí", "❌ No", "🔨 Algo básico"],
          });
          break;
        case 7:
          if (profile.hasBranding !== false) {
            await pushBot("¿Cómo describirías el estilo de tu marca?", "chips", {
              options: brandStyles,
              multiSelect: true,
            });
          } else {
            advance(8);
          }
          break;
        case 8:
          await pushBot("¿Tienes redes sociales? Compárteme tus handles.", "social-inputs");
          break;
        case 9:
          await pushBot(
            "Último paso: ¿qué tan importante es cada servicio para ti ahora mismo?",
            "stars"
          );
          break;
        case 10:
          submitOnboarding(profile);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pushBot, profile.businessIndustry, profile.hasBranding]
  );

  useEffect(() => {
    if (step === 0) advance(1);
  }, [step, advance]);

  // ─── Handlers ─────────────────────────────────────
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    const val = textInput.trim();
    setTextInput("");

    switch (step) {
      case 1:
        pushUser(val);
        markAnswered();
        setProfile((p) => ({ ...p, businessName: val }));
        await ackThenAsk(
          `¡Genial, ${val}! 🎯`,
          "¿En qué giro está tu negocio?",
          "chips",
          { options: industries }
        );
        setStep(2);
        break;
      case 3:
        pushUser(val);
        markAnswered();
        setAwaitingTextInput(false);
        setProfile((p) => ({ ...p, businessDescription: val }));
        await ackThenAsk(
          "Entendido. 👌",
          "¿Quién es tu cliente ideal?",
          "chips",
          { options: audienceChips, multiSelect: true }
        );
        setStep(4);
        break;
    }
  };

  const handleChips = async (selected: string[], stepNum: number) => {
    pushUser(selected.join(", "));
    markAnswered();

    switch (stepNum) {
      case 2: {
        const cleaned = selected[0].replace(/^[^\s]+\s/, "");
        setProfile((p) => ({ ...p, businessIndustry: cleaned }));
        const subs = industrySubcategories[cleaned];
        if (subs) {
          await ackThenAsk(
            `Perfecto, conozco bien el sector de ${cleaned}. 💪`,
            "¿Cuál describe mejor tu negocio?",
            "chips",
            { options: subs }
          );
        } else {
          await ackThenAsk(
            `Perfecto, conozco bien el sector de ${cleaned}. 💪`,
            "Cuéntame en una oración: ¿qué hace tu negocio?",
            "input"
          );
        }
        setStep(3);
        break;
      }
      case 3: {
        const val = selected[0];
        if (val === "Otro") {
          setAwaitingTextInput(true);
          await pushBot("Cuéntame en una oración: ¿qué hace tu negocio?", "input");
          // Stay on step 3 but now expecting text input
        } else {
          setProfile((p) => ({ ...p, businessDescription: val }));
          await ackThenAsk(
            "Entendido. 👌",
            "¿Quién es tu cliente ideal?",
            "chips",
            { options: audienceChips, multiSelect: true }
          );
          setStep(4);
        }
        break;
      }
      case 4: {
        const cleaned = selected.map((s) => s.replace(/^[^\s]+\s/, "")).join(", ");
        setProfile((p) => ({ ...p, targetAudience: cleaned }));
        await ackThenAsk(
          `Claro, ${cleaned}. 🎯`,
          "¿Tienes un sitio web? Puedo analizarlo para ahorrar tiempo.",
          "url"
        );
        setStep(5);
        break;
      }
      case 5.5: {
        // Analysis confirmation
        if (selected[0].includes("Correcto")) {
          await ackThenAsk(
            "¡Perfecto! Ya tengo buena info de tu sitio. 🚀",
            "¿Tienes redes sociales? Compárteme tus handles.",
            "social-inputs"
          );
          setStep(8);
        } else {
          await pushBot("Ok, sigamos paso a paso para ajustar.");
          advance(6);
        }
        break;
      }
      case 6: {
        const val = selected[0];
        const hasBranding = val.includes("Sí") ? true : val.includes("No") ? false : null;
        setProfile((p) => ({ ...p, hasBranding }));
        if (hasBranding === false) {
          await ackThenAsk(
            "No te preocupes, podemos crear tu marca desde cero. 🎨",
            "¿Tienes redes sociales? Compárteme tus handles.",
            "social-inputs"
          );
          setStep(8);
        } else {
          const ack = hasBranding ? "Buena base. 👍" : "Algo es mejor que nada. 😉";
          await ackThenAsk(
            ack,
            "¿Cómo describirías el estilo de tu marca?",
            "chips",
            { options: brandStyles, multiSelect: true }
          );
          setStep(7);
        }
        break;
      }
      case 7:
        setProfile((p) => ({ ...p, brandStyle: selected.join(", ") }));
        await ackThenAsk(
          `${selected.join(" + ")} — buena combinación. ✨`,
          "¿Tienes redes sociales? Compárteme tus handles.",
          "social-inputs"
        );
        setStep(8);
        break;
    }
  };

  const handleUrlResult = async (data: Record<string, string>, url: string) => {
    markAnswered();
    pushUser(url);

    setProfile((p) => ({
      ...p,
      website: url,
      ...(data.businessName && !p.businessName ? { businessName: data.businessName } : {}),
      ...(data.businessDescription && !p.businessDescription
        ? { businessDescription: data.businessDescription }
        : {}),
      ...(data.businessIndustry && !p.businessIndustry ? { businessIndustry: data.businessIndustry } : {}),
      ...(data.targetAudience && !p.targetAudience ? { targetAudience: data.targetAudience } : {}),
      ...(data.brandColors ? { brandColors: data.brandColors } : {}),
      ...(data.brandStyle ? { brandStyle: data.brandStyle } : {}),
      hasBranding: true,
    }));

    const desc = data.businessDescription || "";
    if (desc) {
      await pushBot(
        `Vi que tu negocio se trata de: "${desc}"\n\n¿Es correcto?`,
        "chips",
        { options: ["✅ Correcto", "✏️ Quiero ajustar algo"] }
      );
      setStep(5.5 as number);
    } else {
      await ackThenAsk(
        "Guardé tu sitio web. Sigamos con unas preguntas rápidas. 👍",
        "¿Ya tienes logo o identidad visual?",
        "chips",
        { options: ["✅ Sí", "❌ No", "🔨 Algo básico"] }
      );
      setStep(6);
    }
  };

  const handleUrlFail = async (url: string) => {
    markAnswered();
    pushUser(url);
    const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    setProfile((p) => ({ ...p, website: fullUrl }));
    await ackThenAsk(
      "Guardé tu sitio web. Sigamos con unas preguntas rápidas. 👍",
      "¿Ya tienes logo o identidad visual?",
      "chips",
      { options: ["✅ Sí", "❌ No", "🔨 Algo básico"] }
    );
    setStep(6);
  };

  const handleUrlSkip = async () => {
    pushUser("No tengo sitio web");
    markAnswered();
    setProfile((p) => ({ ...p, website: undefined }));
    await ackThenAsk(
      "Sin problema. 👍",
      "¿Ya tienes logo o identidad visual?",
      "chips",
      { options: ["✅ Sí", "❌ No", "🔨 Algo básico"] }
    );
    setStep(6);
  };

  const handleSocial = async (data: Record<string, string>) => {
    const filled = Object.entries(data).filter(([, v]) => v);
    pushUser(
      filled.length > 0
        ? filled.map(([k, v]) => `${k}: ${v}`).join(", ")
        : "Sin redes por ahora"
    );
    markAnswered();
    setProfile((p) => ({
      ...p,
      socialMedia: Object.fromEntries(filled),
    }));
    const ack = filled.length > 0
      ? "Anotado. 📱"
      : "Las redes son clave, te podemos ayudar con eso. 📱";
    await ackThenAsk(
      ack,
      "Último paso: ¿qué tan importante es cada servicio para ti ahora mismo?",
      "stars"
    );
    setStep(9);
  };

  const handleStars = async (ratings: Record<string, number>) => {
    const labels: Record<string, string> = {
      design: "Diseño",
      web: "Web",
      marketing: "Marketing",
    };
    pushUser(
      Object.entries(ratings)
        .map(([k, v]) => `${labels[k] || k}: ${"⭐".repeat(v)}`)
        .join(", ")
    );
    markAnswered();
    const finalProfile = { ...profile, priorities: ratings };
    setProfile(finalProfile);
    await pushBot(getPriorityAck(ratings));
    setStep(10);
    submitOnboarding(finalProfile);
  };

  // ─── Submit ─────────────────────────────────────
  const submitOnboarding = async (finalProfile: OnboardingProfile) => {
    setSaving(true);
    await pushBot("Guardando tu perfil... 🎉");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: finalProfile.businessName,
          businessIndustry: finalProfile.businessIndustry,
          businessDescription: finalProfile.businessDescription,
          targetAudience: finalProfile.targetAudience,
          hasBranding: finalProfile.hasBranding,
          brandColors: finalProfile.brandColors || null,
          brandStyle: finalProfile.brandStyle || null,
          website: finalProfile.website || null,
          socialMedia:
            finalProfile.socialMedia && Object.keys(finalProfile.socialMedia).length > 0
              ? finalProfile.socialMedia
              : null,
          priorities: finalProfile.priorities || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        await pushBot(`Hubo un error: ${data.error}. Intenta de nuevo.`);
        setSaving(false);
        return;
      }

      await pushBot(
        data.welcomeCredits
          ? `✅ ¡Listo! Tu perfil está configurado.\n\n🎁 Te regalamos ${data.welcomeCredits} créditos de bienvenida.\n\nRedirigiendo a tu panel...`
          : "✅ ¡Listo! Tu perfil está configurado.\n\nRedirigiendo a tu panel..."
      );
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch {
      await pushBot("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────
  const isTextStep = step === 1 || (step === 3 && (!industrySubcategories[profile.businessIndustry || ""] || awaitingTextInput));

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-1 px-4 py-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 transition-colors ${
              s <= Math.floor(step) ? "bg-[var(--gold-bar)]" : "bg-[rgba(245,246,252,0.1)]"
            }`}
          />
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-4 pt-4 pb-8"
      >
        {messages.map((msg) => {
          if (msg.role === "user") {
            return <UserBubble key={msg.id}>{msg.content}</UserBubble>;
          }

          return (
            <div key={msg.id} className="space-y-2">
              <BotBubble>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </BotBubble>

              {!msg.answered && (
                <>
                  {msg.type === "chips" && msg.options && (
                    <div className="ml-11">
                      <ChipSelector
                        options={msg.options}
                        multiSelect={msg.multiSelect}
                        onConfirm={(sel) => {
                          const s = step === 5.5 ? 5.5 : Math.floor(step);
                          handleChips(sel, s);
                        }}
                      />
                    </div>
                  )}
                  {msg.type === "url" && (
                    <div className="ml-11">
                      <UrlAnalyzer
                        onResult={handleUrlResult}
                        onFail={handleUrlFail}
                        onSkip={handleUrlSkip}
                      />
                    </div>
                  )}
                  {msg.type === "social-inputs" && (
                    <div className="ml-11">
                      <SocialInputs onConfirm={handleSocial} />
                    </div>
                  )}
                  {msg.type === "stars" && (
                    <div className="ml-11">
                      <StarRating
                        rows={[
                          { label: "🎨 Diseño", key: "design" },
                          { label: "💻 Web", key: "web" },
                          { label: "📱 Marketing", key: "marketing" },
                        ]}
                        onConfirm={handleStars}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        {typing && <TypingIndicator />}
      </div>

      {/* Text input (only for free-text steps) */}
      {isTextStep && !typing && (
        <form
          onSubmit={handleTextSubmit}
          className="border-t border-[rgba(245,246,252,0.1)] p-4"
        >
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Escribe tu respuesta..."
              disabled={saving}
              autoFocus
              className="flex-1 border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] focus:border-[var(--gold-bar)]"
            />
            <Button
              type="submit"
              disabled={!textInput.trim() || saving}
              className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Social inputs ────────────────────────────────
function SocialInputs({
  onConfirm,
}: {
  onConfirm: (data: Record<string, string>) => void;
}) {
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  return (
    <div className="space-y-2">
      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram: @tuhandle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook: Tu Página" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok: @tuhandle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <div className="flex gap-2">
        <Button onClick={() => onConfirm({ instagram, facebook, tiktok })} className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4">Confirmar</Button>
        <button onClick={() => onConfirm({})} className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[rgba(245,246,252,0.6)]">Sin redes →</button>
      </div>
    </div>
  );
}
