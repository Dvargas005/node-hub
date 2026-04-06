import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";

const translations: Record<string, Record<string, string>> = { es, en, pt };

export function t(key: string, lang: string = "es"): string {
  return translations[lang]?.[key] || translations["es"]?.[key] || key;
}

export function getLanguageName(code: string): string {
  const names: Record<string, string> = { es: "Español", en: "English", pt: "Português" };
  return names[code] || code;
}

export const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];
