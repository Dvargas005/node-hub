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
import { useTranslation } from "@/hooks/useTranslation";

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
  phone?: string;
  whatsappNumber?: string;
  telegramId?: string;
  linkedinUrl?: string;
  instagramHandle?: string;
  preferredContact?: string;
}

type MsgType =
  | "text"
  | "chips"
  | "input"
  | "url"
  | "social-inputs"
  | "stars"
  | "contact-inputs";

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
  "🍽️ Food & Bakery",
  "🛍️ Retail / Store",
  "💼 Professional Services",
  "🏥 Health & Therapy",
  "💻 Technology",
  "📚 Education",
  "🎉 Events",
  "🏗️ Construction",
  "🚚 Transportation",
  "🏠 Real Estate",
  "🚗 Automotive",
  "🧹 Cleaning & Maintenance",
  "💇 Beauty & Hair",
  "💪 Fitness & Gym",
  "⚖️ Legal",
  "✈️ Tourism & Hospitality",
  "🌾 Agriculture",
  "🔧 Other",
];

const industrySubcategories: Record<string, string[]> = {
  "Food & Bakery": ["Artisan bakery", "Restaurant", "Food truck", "Catering", "Pastry shop", "Coffee shop", "Other"],
  "Retail / Store": ["Boutique", "Online store", "Grocery", "Hardware store", "Jewelry", "Other"],
  "Professional Services": ["Lawyer", "Accountant", "Consultant", "Notary", "Agency", "Other"],
  "Health & Therapy": ["Medical office", "Physical therapy", "Nutrition", "Aesthetics", "Dentist", "Other"],
  "Technology": ["Software development", "Tech support", "SaaS", "E-commerce", "Other"],
  "Education": ["Academy", "Tutoring", "Online courses", "Training", "Other"],
  "Events": ["Event planner", "Photographer", "DJ / Music", "Banquets", "Other"],
  "Construction": ["General contractor", "Plumbing", "Electrical", "Painting", "Architecture", "Other"],
  "Transportation": ["Moving", "Logistics", "Delivery", "Other"],
  "Real Estate": ["Real estate agent", "Builder", "Property management", "Other"],
  "Automotive": ["Mechanic shop", "Auto parts", "Car wash", "Detailing", "Other"],
  "Cleaning & Maintenance": ["Residential cleaning", "Commercial cleaning", "Landscaping", "Other"],
  "Beauty & Hair": ["Beauty salon", "Barber shop", "Aesthetics", "Nails", "Makeup", "Other"],
  "Fitness & Gym": ["Gym", "Personal trainer", "Yoga / Pilates", "CrossFit", "Other"],
  "Legal": ["General practice", "Immigration", "Employment", "Criminal", "Other"],
  "Tourism & Hospitality": ["Hotel", "Travel agency", "Tour operator", "Tourist restaurant", "Other"],
  "Agriculture": ["Farming", "Ranching", "Agroindustry", "Nursery", "Other"],
};

const audienceChips = [
  "👤 End consumer (B2C)",
  "🏢 Businesses (B2B)",
  "👥 Both",
  "👨‍👩‍👧‍👦 Families",
  "👩‍💼 Professionals",
  "🌎 Local community",
  "📱 Online / E-commerce",
];

const brandStyles = [
  "Minimalist", "Bold", "Elegant", "Modern",
  "Classic", "Fun", "Corporate",
];

// ─── Helpers ────────────────────────────────────────
function randDelay() {
  return 800 + Math.random() * 400;
}

function getPriorityAck(ratings: Record<string, number>): string {
  const max = Object.entries(ratings).sort(([, a], [, b]) => b - a)[0];
  const labels: Record<string, string> = {
    design: "design is your top priority",
    web: "web presence is key for you",
    marketing: "marketing is what you need most",
  };
  if (max && max[1] >= 4) {
    return `I see that ${labels[max[0]] || max[0]}! We have perfect services for that.`;
  }
  return "Great mix of priorities!";
}

// ─── Component ──────────────────────────────────────
export function OnboardingClient({
  initialBusinessName,
}: {
  initialBusinessName: string;
}) {
  const { t } = useTranslation();
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
              `Hi! 👋 I see your business is ${profile.businessName}. Let's set up your profile in under 2 minutes.`
            );
            await pushBot("What industry is your business in?", "chips", { options: industries });
            setStep(2);
            return;
          }
          await pushBot(
            "Hi! 👋 I'm the N.O.D.E. assistant. Let's set up your profile in under 2 minutes."
          );
          await pushBot("What's your business name?", "input");
          break;
        case 2:
          await pushBot("What industry is your business in?", "chips", { options: industries });
          break;
        case 3: {
          const subs = industrySubcategories[profile.businessIndustry || ""];
          if (subs) {
            await pushBot(
              "Which best describes your business?",
              "chips",
              { options: subs }
            );
          } else {
            await pushBot("Tell me in one sentence: what does your business do?", "input");
          }
          break;
        }
        case 4:
          await pushBot(
            "Who's your ideal customer?",
            "chips",
            { options: audienceChips, multiSelect: true }
          );
          break;
        case 5:
          await pushBot(
            "Do you have a website? I can analyze it to save time.",
            "url"
          );
          break;
        case 6:
          await pushBot("Do you have a logo or visual identity?", "chips", {
            options: ["✅ Yes", "❌ No", "🔨 Something basic"],
          });
          break;
        case 7:
          if (profile.hasBranding !== false) {
            await pushBot("How would you describe your brand style?", "chips", {
              options: brandStyles,
              multiSelect: true,
            });
          } else {
            advance(8);
          }
          break;
        case 8:
          await pushBot("Do you have social media? Share your handles.", "social-inputs");
          break;
        case 9:
          await pushBot(
            "Almost done: how important is each service to you right now?",
            "stars"
          );
          break;
        case 10:
          await pushBot(t("onboarding.contact"), "contact-inputs");
          break;
        case 11:
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
          `Great, ${val}! 🎯`,
          "What industry is your business in?",
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
          "Got it. 👌",
          "Who's your ideal customer?",
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
            `Great, I know the ${cleaned} sector well. 💪`,
            "Which best describes your business?",
            "chips",
            { options: subs }
          );
        } else {
          await ackThenAsk(
            `Great, I know the ${cleaned} sector well. 💪`,
            "Tell me in one sentence: what does your business do?",
            "input"
          );
        }
        setStep(3);
        break;
      }
      case 3: {
        const val = selected[0];
        if (val === "Other") {
          setAwaitingTextInput(true);
          await pushBot("Tell me in one sentence: what does your business do?", "input");
          // Stay on step 3 but now expecting text input
        } else {
          setProfile((p) => ({ ...p, businessDescription: val }));
          await ackThenAsk(
            "Got it. 👌",
            "Who's your ideal customer?",
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
          `Sure, ${cleaned}. 🎯`,
          "Do you have a website? I can analyze it to save time.",
          "url"
        );
        setStep(5);
        break;
      }
      case 5.5: {
        // Analysis confirmation
        if (selected[0].includes("Correct")) {
          await ackThenAsk(
            "Perfect! I got good info from your site. 🚀",
            "Do you have social media? Share your handles.",
            "social-inputs"
          );
          setStep(8);
        } else {
          await pushBot("Ok, let's go step by step to adjust.");
          advance(6);
        }
        break;
      }
      case 6: {
        const val = selected[0];
        const hasBranding = val.includes("Yes") ? true : val.includes("No") ? false : null;
        setProfile((p) => ({ ...p, hasBranding }));
        if (hasBranding === false) {
          await ackThenAsk(
            "Don't worry, we can create your brand from scratch. 🎨",
            "Do you have social media? Share your handles.",
            "social-inputs"
          );
          setStep(8);
        } else {
          const ack = hasBranding ? "Good foundation. 👍" : "Something is better than nothing. 😉";
          await ackThenAsk(
            ack,
            "How would you describe your brand style?",
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
          `${selected.join(" + ")} — great combo. ✨`,
          "Do you have social media? Share your handles.",
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
        `I see your business is about: "${desc}"\n\nIs that correct?`,
        "chips",
        { options: ["✅ Correct", "✏️ I want to adjust something"] }
      );
      setStep(5.5 as number);
    } else {
      await ackThenAsk(
        "Saved your website. Let's continue with a few quick questions. 👍",
        "Do you have a logo or visual identity?",
        "chips",
        { options: ["✅ Yes", "❌ No", "🔨 Something basic"] }
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
      "Saved your website. Let's continue with a few quick questions. 👍",
      "Do you have a logo or visual identity?",
      "chips",
      { options: ["✅ Yes", "❌ No", "🔨 Something basic"] }
    );
    setStep(6);
  };

  const handleUrlSkip = async () => {
    pushUser("I don't have a website");
    markAnswered();
    setProfile((p) => ({ ...p, website: undefined }));
    await ackThenAsk(
      "No problem. 👍",
      "Do you have a logo or visual identity?",
      "chips",
      { options: ["✅ Yes", "❌ No", "🔨 Something basic"] }
    );
    setStep(6);
  };

  const handleSocial = async (data: Record<string, string>) => {
    const filled = Object.entries(data).filter(([, v]) => v);
    pushUser(
      filled.length > 0
        ? filled.map(([k, v]) => `${k}: ${v}`).join(", ")
        : "No social media for now"
    );
    markAnswered();
    setProfile((p) => ({
      ...p,
      socialMedia: Object.fromEntries(filled),
    }));
    const ack = filled.length > 0
      ? "Noted. 📱"
      : "Social media is key, we can help with that. 📱";
    await ackThenAsk(
      ack,
      "Last step: how important is each service to you right now?",
      "stars"
    );
    setStep(9);
  };

  const handleStars = async (ratings: Record<string, number>) => {
    const labels: Record<string, string> = {
      design: "Design",
      web: "Web",
      marketing: "Marketing",
    };
    pushUser(
      Object.entries(ratings)
        .map(([k, v]) => `${labels[k] || k}: ${"⭐".repeat(v)}`)
        .join(", ")
    );
    markAnswered();
    setProfile((p) => ({ ...p, priorities: ratings }));
    await pushBot(getPriorityAck(ratings));
    await pushBot(t("onboarding.contact"), "contact-inputs");
    setStep(10);
  };

  const handleContact = async (data: {
    phone?: string;
    whatsappNumber?: string;
    telegramId?: string;
    linkedinUrl?: string;
    instagramHandle?: string;
    preferredContact?: string;
  }) => {
    markAnswered();
    const filled = Object.entries(data).filter(([k, v]) => k !== "preferredContact" && !!v);
    pushUser(
      filled.length > 0
        ? filled.map(([k, v]) => `${k}: ${v}`).join(", ")
        : t("onboarding.contact.skip")
    );
    const finalProfile = { ...profile, ...data };
    setProfile(finalProfile);
    setStep(11);
    await submitOnboarding(finalProfile);
  };

  // ─── Submit ─────────────────────────────────────
  const submitOnboarding = async (finalProfile: OnboardingProfile) => {
    setSaving(true);
    await pushBot("Saving your profile... 🎉");

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
          phone: finalProfile.phone || null,
          whatsappNumber: finalProfile.whatsappNumber || null,
          telegramId: finalProfile.telegramId || null,
          linkedinUrl: finalProfile.linkedinUrl || null,
          instagramHandle: finalProfile.instagramHandle || null,
          preferredContact: finalProfile.preferredContact || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        await pushBot(`There was an error: ${data.error}. Try again.`);
        setSaving(false);
        return;
      }

      await pushBot(
        data.welcomeCredits
          ? `✅ All set! Your profile is configured.\n\n🎁 You received ${data.welcomeCredits} welcome credits.\n\nRedirecting to your dashboard...`
          : "✅ All set! Your profile is configured.\n\nRedirecting to your dashboard..."
      );
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch {
      await pushBot("Connection error. Try again.");
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────
  const isTextStep = step === 1 || (step === 3 && (!industrySubcategories[profile.businessIndustry || ""] || awaitingTextInput));

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-1 px-4 py-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
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
                          { label: "🎨 Design", key: "design" },
                          { label: "💻 Web", key: "web" },
                          { label: "📱 Marketing", key: "marketing" },
                        ]}
                        onConfirm={handleStars}
                      />
                    </div>
                  )}
                  {msg.type === "contact-inputs" && (
                    <div className="ml-11">
                      <ContactInputs onConfirm={handleContact} />
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
              placeholder="Type your answer..."
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
      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram: @yourhandle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook: Your Page" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok: @yourhandle" className="border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm" />
      <div className="flex gap-2">
        <Button onClick={() => onConfirm({ instagram, facebook, tiktok })} className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4">Confirm</Button>
        <button onClick={() => onConfirm({})} className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[rgba(245,246,252,0.6)]">No social media →</button>
      </div>
    </div>
  );
}

// ─── Contact inputs ────────────────────────────────
function ContactInputs({
  onConfirm,
}: {
  onConfirm: (data: {
    phone?: string;
    whatsappNumber?: string;
    telegramId?: string;
    linkedinUrl?: string;
    instagramHandle?: string;
    preferredContact?: string;
  }) => void;
}) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [preferred, setPreferred] = useState<string>("email");

  const inputCls =
    "border-[rgba(245,246,252,0.2)] bg-[rgba(255,255,255,0.05)] text-[var(--ice-white)] placeholder:text-[rgba(245,246,252,0.3)] h-8 text-sm";

  const submit = () => {
    onConfirm({
      phone: phone.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
      telegramId: telegram.trim() || undefined,
      linkedinUrl: linkedin.trim() || undefined,
      instagramHandle: instagram.trim() || undefined,
      preferredContact: preferred,
    });
  };

  const methods: { key: string; label: string }[] = [
    { key: "email", label: t("contact.method.email") },
    { key: "phone", label: t("contact.method.phone") },
    { key: "whatsapp", label: t("contact.method.whatsapp") },
    { key: "telegram", label: t("contact.method.telegram") },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-[rgba(245,246,252,0.5)]">{t("onboarding.contact.hint")}</p>
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={`📱 ${t("contact.phone")}: ${t("contact.placeholder.phone")}`}
        className={inputCls}
      />
      <Input
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder={`💬 WhatsApp: ${t("contact.placeholder.whatsapp")}`}
        className={inputCls}
      />
      <Input
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
        placeholder={`✈️ Telegram: ${t("contact.placeholder.telegram")}`}
        className={inputCls}
      />
      <Input
        value={linkedin}
        onChange={(e) => setLinkedin(e.target.value)}
        placeholder={`💼 LinkedIn: ${t("contact.placeholder.linkedin")}`}
        className={inputCls}
      />
      <Input
        value={instagram}
        onChange={(e) => setInstagram(e.target.value)}
        placeholder={`📸 Instagram: ${t("contact.placeholder.instagram")}`}
        className={inputCls}
      />
      <div className="pt-1">
        <p className="text-xs text-[rgba(245,246,252,0.5)] mb-1">{t("contact.preferred")}</p>
        <div className="flex flex-wrap gap-1">
          {methods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setPreferred(m.key)}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                preferred === m.key
                  ? "border-[var(--gold-bar)] bg-[var(--gold-bar)] text-[var(--asphalt-black)] font-medium"
                  : "border-[rgba(245,246,252,0.2)] bg-transparent text-[rgba(245,246,252,0.7)] hover:border-[var(--gold-bar)]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          onClick={submit}
          className="bg-[var(--gold-bar)] text-[var(--asphalt-black)] hover:opacity-90 font-bold text-sm h-8 px-4"
        >
          {t("onboarding.contact.continue")}
        </Button>
        <button
          onClick={() => onConfirm({ preferredContact: "email" })}
          className="text-xs text-[rgba(245,246,252,0.4)] hover:text-[rgba(245,246,252,0.6)]"
        >
          {t("onboarding.contact.skip")} →
        </button>
      </div>
    </div>
  );
}
