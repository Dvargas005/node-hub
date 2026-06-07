import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function GET(req: Request) {
  const { error } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const clients = await db.user.findMany({
      where: { role: "CLIENT", userTag: null },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessIndustry: true,
        phone: true,
        whatsappNumber: true,
        preferredContact: true,
        freeCredits: true,
        subscription: {
          select: {
            status: true,
            creditsRemaining: true,
            plan: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      business: c.businessName,
      industry: c.businessIndustry,
      phone: c.phone,
      whatsapp: c.whatsappNumber,
      preferredContact: c.preferredContact,
      plan: c.subscription?.plan?.name || "No plan",
      planStatus: c.subscription?.status || "NONE",
      totalCredits: (c.freeCredits || 0) + (c.subscription?.creditsRemaining || 0),
    }));

    return NextResponse.json({ clients: result, count: result.length });
  } catch (err) {
    console.error("[pm/clients]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
