"use client";
import { useEffect, useState } from "react";
import { t as translate, LANGUAGES } from "@/lib/i18n";

export function useTranslation() {
  const [lang, setLang] = useState("es");

  useEffect(() => {
    const saved = localStorage.getItem("node-language") || "es";
    setLang(saved);
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
