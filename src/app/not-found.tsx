import Link from "next/link";
import { cookies } from "next/headers";
import { t, DEFAULT_LANG } from "@/lib/i18n";

export default async function NotFound() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("node-language")?.value || DEFAULT_LANG;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#130A06] text-[#F5F6FC]">
      <h1 className="text-6xl font-bold text-[#FFC919]">404</h1>
      <p className="text-xl">{t("notFound.message", lang)}</p>
      <Link href="/" className="px-6 py-3 bg-[#FFC919] text-[#130A06] font-bold">
        {t("notFound.backHome", lang)}
      </Link>
    </div>
  );
}
