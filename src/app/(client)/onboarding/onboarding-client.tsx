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
  | "stars"
  | "analysis-result";

interface ChatMsg {
  id: string;
  role: "bot" | "user";
  content: string;
  type: MsgType;
  options?: string[];
  multiSelect?: boolean;
  answered?: boolean;
}

// ─── Step definitions ───────────────────────────────
const industries = [
  "🍽️ Restaurante",
  "🛍️ Tienda / Retail",
  "💼 Servicios profesionales",
  "🏥 Salud / Bienestar",
  "💻 Tecnología",
  "📚 Educación",
  "🎉 Eventos",
  "🏗️ Construcción",
  "🚚 Transporte",
  "🔧 Otro",
];

const brandStyles = [
  "Minimalista",
  "Bold / Atrevido",
  "Elegante",
  "Moderno",
  "Clásico",
  "Divertido",
  "Corporativo",
];

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = () =>
    setTimeout(
      () =>
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        }),
      50
    );

  const addBot = useCallback(
    (content: string, type: MsgType = "text", opts?: Partial<ChatMsg>) => {
      setTyping(true);
      scroll();
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            role: "bot",
            content,
            type,
            ...opts,
          },
        ]);
        scroll();
      }, 600);
    },
    []
  );

  const addUser = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content, type: "text" },
    ]);
    scroll();
  };

  // Mark the last interactive message as answered
  const markAnswered = () => {
    setMessages((prev) => {
      const last = [...prev];
      for (let i = last.length - 1; i >= 0; i--) {
        if (last[i].role === "bot" && !last[i].answered) {
          last[i] = { ...last[i], answered: true };
          break;
        }
      }
      return last;
    });
  };

  // ─── Step machine ───────────────────────────────
  const advance = useCallback(
    (nextStep: number) => {
      setStep(nextStep);

      switch (nextStep) {
        case 1:
          addBot(
            "¡Hola! 👋 Soy el asistente de N.O.D.E. Vamos a configurar tu perfil en menos de 2 minutos.\n\n¿Cómo se llama tu negocio?",
            "input"
          );
          break;
        case 2:
          addBot("¿En qué giro está tu negocio?", "chips", {
            options: industries,
          });
          break;
        case 3:
          addBot(
            "Cuéntame en una oración: ¿qué hace tu negocio?",
            "input"
          );
          break;
        case 4:
          addBot("¿A quién le vendes? ¿Quién es tu cliente ideal?", "input");
          break;
        case 5:
          addBot("¿Tienes un sitio web? Puedo analizarlo para ahorrar tiempo.", "url");
          break;
        case 6:
          addBot("¿Ya tienes logo o identidad visual?", "chips", {
            options: ["✅ Sí", "❌ No", "🔨 Algo básico"],
          });
          break;
        case 7:
          if (profile.hasBranding !== false) {
            addBot("¿Cómo describirías el estilo de tu marca?", "chips", {
              options: brandStyles,
              multiSelect: true,
            });
          } else {
            advance(8);
          }
          break;
        case 8:
          addBot("¿Tienes redes sociales? Compárteme tus handles.", "social-inputs");
          break;
        case 9:
          addBot(
            "Último paso: ¿qué tan importante es cada servicio para ti ahora mismo?",
            "stars"
          );
          break;
        case 10:
          handleSubmit();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addBot, profile.hasBranding]
  );

  // Start on mount
  useEffect(() => {
    if (step === 0) advance(1);
  }, [step, advance]);

  // ─── Handlers ───────────────────────────────────
  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    const val = textInput.trim();
    setTextInput("");

    switch (step) {
      case 1:
        addUser(val);
        markAnswered();
        setProfile((p) => ({ ...p, businessName: val }));
        advance(2);
        break;
      case 3:
        addUser(val);
        markAnswered();
        setProfile((p) => ({ ...p, businessDescription: val }));
        advance(4);
        break;
      case 4:
        addUser(val);
        markAnswered();
        setProfile((p) => ({ ...p, targetAudience: val }));
        advance(5);
        break;
    }
  };

  const handleChips = (selected: string[], stepNum: number) => {
    addUser(selected.join(", "));
    markAnswered();

    switch (stepNum) {
      case 2: {
        const cleaned = selected[0].replace(/^[^\s]+\s/, "");
        setProfile((p) => ({ ...p, businessIndustry: cleaned }));
        advance(3);
        break;
      }
      case 6: {
        const val = selected[0];
        const hasBranding = val.includes("Sí") ? true : val.includes("No") ? false : null;
        setProfile((p) => ({ ...p, hasBranding }));
        advance(7);
        break;
      }
      case 7:
        setProfile((p) => ({ ...p, brandStyle: selected.join(", ") }));
        advance(8);
        break;
    }
  };

  const handleUrlResult = (
    data: Record<string, string>,
    url: string
  ) => {
    markAnswered();
    setProfile((p) => ({
      ...p,
      website: url,
      ...(data.businessName && !p.businessName ? { businessName: data.businessName } : {}),
      ...(data.businessDescription && !p.businessDescription
        ? { businessDescription: data.businessDescription }
        : {}),
      ...(data.businessIndustry ? { businessIndustry: data.businessIndustry } : {}),
      ...(data.targetAudience ? { targetAudience: data.targetAudience } : {}),
      ...(data.brandColors ? { brandColors: data.brandColors } : {}),
      ...(data.brandStyle ? { brandStyle: data.brandStyle } : {}),
      hasBranding: true,
    }));

    const found: string[] = [];
    if (data.businessDescription) found.push(`📝 ${data.businessDescription}`);
    if (data.businessIndustry) found.push(`🏷️ ${data.businessIndustry}`);
    if (data.brandColors) found.push(`🎨 Colores: ${data.brandColors}`);
    if (data.brandStyle) found.push(`✨ Estilo: ${data.brandStyle}`);

    addUser(url);
    if (found.length > 0) {
      addBot(
        `¡Encontré esta info de tu sitio!\n\n${found.join("\n")}\n\n¿Es correcta?`,
        "chips",
        { options: ["✅ Correcto", "✏️ Quiero ajustar algo"] }
      );
      setStep(5.5 as number);
    } else {
      addBot("No encontré mucha info, pero no te preocupes. Sigamos.");
      advance(6);
    }
  };

  const handleUrlSkip = () => {
    addUser("No tengo sitio web");
    markAnswered();
    setProfile((p) => ({ ...p, website: undefined }));
    advance(6);
  };

  const handleAnalysisConfirm = (selected: string[]) => {
    addUser(selected.join(", "));
    markAnswered();
    if (selected[0].includes("Correcto")) {
      addBot("¡Perfecto! Seguimos con un par de preguntas más.");
      advance(8); // Skip branding questions since URL gave us that info
    } else {
      addBot("Ok, sigamos paso a paso para ajustar.");
      advance(6);
    }
  };

  const handleSocial = (data: Record<string, string>) => {
    addUser(
      Object.entries(data)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ") || "Sin redes por ahora"
    );
    markAnswered();
    setProfile((p) => ({
      ...p,
      socialMedia: Object.fromEntries(
        Object.entries(data).filter(([, v]) => v)
      ),
    }));
    advance(9);
  };

  const handleStars = (ratings: Record<string, number>) => {
    const labels: Record<string, string> = {
      design: "Diseño",
      web: "Web",
      marketing: "Marketing",
    };
    addUser(
      Object.entries(ratings)
        .map(([k, v]) => `${labels[k] || k}: ${"⭐".repeat(v)}`)
        .join(", ")
    );
    markAnswered();
    setProfile((p) => ({ ...p, priorities: ratings }));
    advance(10);
  };

  // ─── Submit ─────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    addBot("¡Guardando tu perfil... 🎉");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: profile.businessName,
          businessIndustry: profile.businessIndustry,
          businessDescription: profile.businessDescription,
          targetAudience: profile.targetAudience,
          hasBranding: profile.hasBranding,
          brandColors: profile.brandColors || null,
          brandStyle: profile.brandStyle || null,
          website: profile.website || null,
          socialMedia:
            profile.socialMedia && Object.keys(profile.socialMedia).length > 0
              ? profile.socialMedia
              : null,
          priorities: profile.priorities || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addBot(`Hubo un error: ${data.error}. Intenta de nuevo.`);
        setSaving(false);
        return;
      }

      setTimeout(() => {
        addBot(
          data.welcomeCredits
            ? `✅ ¡Listo! Tu perfil está configurado. Te regalamos ${data.welcomeCredits} créditos de bienvenida. 🎁\n\nRedirigiendo a tu panel...`
            : "✅ ¡Listo! Tu perfil está configurado. Redirigiendo a tu panel..."
        );
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }, 600);
    } catch {
      addBot("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  };

  // ─── Render helpers ─────────────────────────────
  const isCurrentInputStep = [1, 3, 4].includes(step);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-1 px-4 py-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 transition-colors ${
              s <= step ? "bg-[var(--gold-bar)]" : "bg-[rgba(245,246,252,0.1)]"
            }`}
          />
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
        {messages.map((msg) => {
          if (msg.role === "user") {
            return (
              <UserBubble key={msg.id}>{msg.content}</UserBubble>
            );
          }

          // Bot messages
          return (
            <div key={msg.id} className="space-y-2">
              <BotBubble>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </BotBubble>

              {/* Interactive elements (only if not answered) */}
              {!msg.answered && (
                <>
                  {msg.type === "chips" && msg.options && (
                    <div className="ml-11">
                      <ChipSelector
                        options={msg.options}
                        multiSelect={msg.multiSelect}
                        onConfirm={(sel) =>
                          step === 5.5
                            ? handleAnalysisConfirm(sel)
                            : handleChips(sel, Math.floor(step))
                        }
                      />
                    </div>
                  )}

                  {msg.type === "url" && (
                    <div className="ml-11">
                      <UrlAnalyzer
                        onResult={handleUrlResult}
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

      {/* Text input */}
      {isCurrentInputStep && !typing && (
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

// ─── Social inputs sub-component ──────────────────
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
      <Input
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder="Instagram: @tuhandle"
        className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm"
      />
      <Input
        value={facebook}
        onChange={(e) => setFacebook(e.target.value)}
        placeholder="Facebook: Tu Página"
        className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm"
      />
      <Input
        value={tiktok}
        onChange={(e) => setTiktok(e.target.value)}
        placeholder="TikTok: @tuhandle"
        className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm"
      />
      <div className="flex gap-2">
        <Button
          onClick={() =>
            onConfirm({ instagram, facebook, tiktok })
          }
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4"
        >
          Confirmar
        </Button>
        <button
          onClick={() => onConfirm({})}
          className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[rgba(245,246,252,0.6)]"
        >
          Sin redes →
        </button>
      </div>
    </div>
  );
}
