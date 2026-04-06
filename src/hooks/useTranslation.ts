"use client";
import { useEffect, useState } from "react";
import { t as translate, LANGUAGES, DEFAULT_LANG } from "@/lib/i18n";

function getInitialLang(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("node-language") || DEFAULT_LANG;
  }
  return DEFAULT_LANG;
}

export function useTranslation() {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    const saved = localStorage.getItem("node-language");
    if (saved && saved !== lang) setLang(saved);
  }, []);

  function t(key: string): string {
    return translate(key, lang);
  }

  function changeLang(newLang: string) {
    setLang(newLang);
    localStorage.setItem("node-language", newLang);
    document.cookie = `node-language=${newLang};path=/;max-age=31536000`;
  }

  return { t, lang, changeLang, languages: LANGUAGES };
}
