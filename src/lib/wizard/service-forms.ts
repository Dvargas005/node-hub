export interface FormQuestion {
  id: string;
  type: "textarea" | "single-select" | "multi-select" | "multi-select-visual" | "color-preset" | "text" | "url";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  autoFill?: string;
  maxLength?: number;
}

export interface ServiceFormConfig {
  serviceSlug: string;
  questions: FormQuestion[];
}

export const serviceForms: Record<string, ServiceFormConfig> = {
  "logo-design": {
    serviceSlug: "logo-design",
    questions: [
      { id: "description", type: "textarea", label: "wizard.form.logo.description", required: true, placeholder: "wizard.form.logo.description.placeholder", maxLength: 500 },
      { id: "style", type: "multi-select-visual", label: "wizard.form.style", options: ["Minimalist", "Bold", "Elegant", "Playful", "Corporate", "Vintage"], required: true },
      { id: "colors", type: "color-preset", label: "wizard.form.colors", autoFill: "brandColors", required: false },
      { id: "references", type: "url", label: "wizard.form.references", required: false, placeholder: "wizard.form.references.placeholder" },
      { id: "notes", type: "textarea", label: "wizard.form.notes", required: false, placeholder: "wizard.form.notes.placeholder", maxLength: 300 },
    ],
  },
  "content-pack": {
    serviceSlug: "content-pack",
    questions: [
      { id: "platforms", type: "multi-select", label: "wizard.form.content.platforms", options: ["Instagram", "Facebook", "TikTok", "LinkedIn", "X/Twitter"], required: true },
      { id: "contentType", type: "multi-select-visual", label: "wizard.form.content.type", options: ["Product photos", "Lifestyle", "Educational/Tips", "Promotions", "Behind the scenes"], required: true },
      { id: "references", type: "text", label: "wizard.form.content.references", required: false, placeholder: "wizard.form.content.references.placeholder" },
      { id: "voice", type: "single-select", label: "wizard.form.voice", options: ["Formal", "Casual", "Playful", "Inspirational", "Technical"], autoFill: "brandStyle", required: false },
      { id: "notes", type: "textarea", label: "wizard.form.notes", required: false, maxLength: 300 },
    ],
  },
  "landing-page": {
    serviceSlug: "landing-page",
    questions: [
      { id: "purpose", type: "single-select", label: "wizard.form.landing.purpose", options: ["Product launch", "Lead generation", "Event", "App download", "Portfolio", "Other"], required: true },
      { id: "sections", type: "multi-select", label: "wizard.form.landing.sections", options: ["Hero", "Features", "Pricing", "Testimonials", "FAQ", "Contact form", "Gallery"], required: true },
      { id: "copy", type: "single-select", label: "wizard.form.landing.copy", options: ["Yes, I'll provide it", "No, write it for me", "I have a draft"], required: true },
      { id: "references", type: "url", label: "wizard.form.references", required: false, placeholder: "wizard.form.landing.references.placeholder" },
      { id: "colors", type: "color-preset", label: "wizard.form.colors", autoFill: "brandColors", required: false },
    ],
  },
  "social-media-management": {
    serviceSlug: "social-media-management",
    questions: [
      { id: "platforms", type: "multi-select", label: "wizard.form.content.platforms", options: ["Instagram", "Facebook", "TikTok", "LinkedIn", "X/Twitter"], required: true },
      { id: "goal", type: "single-select", label: "wizard.form.social.goal", options: ["Brand awareness", "Lead generation", "Community building", "Sales", "Customer support"], required: true },
      { id: "frequency", type: "single-select", label: "wizard.form.social.frequency", options: ["3x/week", "5x/week", "Daily", "Let the team decide"], required: true },
      { id: "voice", type: "single-select", label: "wizard.form.voice", options: ["Formal", "Casual", "Playful", "Inspirational", "Technical"], autoFill: "brandStyle", required: false },
      { id: "references", type: "text", label: "wizard.form.content.references", required: false },
    ],
  },
  "hourly-meeting": {
    serviceSlug: "hourly-meeting",
    questions: [
      { id: "topic", type: "textarea", label: "wizard.form.meeting.topic", required: true, placeholder: "wizard.form.meeting.topic.placeholder", maxLength: 500 },
      { id: "prepare", type: "textarea", label: "wizard.form.meeting.prepare", required: false, placeholder: "wizard.form.meeting.prepare.placeholder", maxLength: 300 },
    ],
  },
};

export function getServiceForm(slug: string): ServiceFormConfig | null {
  return serviceForms[slug] || null;
}
