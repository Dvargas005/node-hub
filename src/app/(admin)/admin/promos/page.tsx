import { db } from "@/lib/db";
import { PromosClient } from "./promos-client";

export default async function PromosPage() {
  let promos: any[] = [];
  try {
    promos = await db.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  } catch (err: any) {
    console.error("[PROMOS_PAGE]", err);
  }

  return <PromosClient initialPromos={JSON.parse(JSON.stringify(promos))} />;
}
