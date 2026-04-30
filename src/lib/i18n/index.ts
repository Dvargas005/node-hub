import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";

const translations: Record<string, Record<string, string>> = { es, en, pt };

export const DEFAULT_LANG = "en";

export function t(key: string, lang: string = DEFAULT_LANG): string {
  return translations[lang]?.[key] || translations[DEFAULT_LANG]?.[key] || key;
}

export function getLanguageName(code: string): string {
  const names: Record<string, string> = { es: "Español", en: "English", pt: "Português" };
  return names[code] || code;
}

export function getLocale(lang: string): string {
  const locales: Record<string, string> = { es: "es-MX", en: "en-US", pt: "pt-BR" };
  return locales[lang] || "en-US";
}

export const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];
