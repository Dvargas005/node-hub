import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePmApiKey } from "@/lib/pm-api-auth";

export async function POST(req: Request) {
  const { error, pmUserId } = await requirePmApiKey(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      clientEmail,
      clientId,
      serviceSlug,
      variantName,
      brief,
      pmNotes,
      isRetroactive,
      retroactiveDate,
      creditsOverride,
    } = body;

    let client;
    if (clientId) {
      client = await db.user.findUnique({ where: { id: clientId } });
    } else if (clientEmail) {
      client = await db.user.findUnique({ where: { email: clientEmail } });
    }
    if (!client) {
      return NextResponse.json(
        { error: "Client not found. Provide clientEmail or clientId." },
        { status: 404 }
      );
    }

    const service = await db.service.findUnique({
      where: { slug: serviceSlug },
      include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    });
    if (!service) {
      return NextResponse.json(
        { error: `Service '${serviceSlug}' not found. Use GET /api/pm/services for available options.` },
        { status: 404 }
      );
    }

    let variant = service.variants.find(
      (v) => v.name.toLowerCase() === (variantName || "").toLowerCase()
    );
    if (!variant) variant = service.variants[0];
    if (!variant) {
      return NextResponse.json({ error: "No active variants for this service" }, { status: 404 });
    }

    const finalCredits = creditsOverride ?? (isRetroactive ? 0 : variant.creditCost);
    const finalStatus = isRetroactive ? "COMPLETED" : "NEW";

    const ticket = await db.$transaction(async (tx) => {
      if (!isRetroactive && finalCredits > 0) {
        const user = await tx.user.findUnique({ where: { id: client!.id } });
        const sub = await tx.subscription.findUnique({ where: { userId: client!.id } });
        const totalCredits =
          (user?.freeCredits || 0) + (sub?.status === "ACTIVE" ? sub.creditsRemaining : 0);

        if (totalCredits < finalCredits) {
          throw new Error(`INSUFFICIENT_CREDITS: client has ${totalCredits}, needs ${finalCredits}`);
        }

        const fromFree = Math.min(user?.freeCredits || 0, finalCredits);
        const fromPlan = finalCredits - fromFree;
        if (fromFree > 0) {
          await tx.user.update({ where: { id: client!.id }, data: { freeCredits: { decrement: fromFree } } });
        }
        if (fromPlan > 0 && sub) {
          await tx.subscription.update({ where: { id: sub.id }, data: { creditsRemaining: { decrement: fromPlan } } });
        }
      }

      return tx.ticket.create({
        data: {
          userId: client!.id,
          variantId: variant!.id,
          status: finalStatus,
          priority: "NORMAL",
          briefRaw: { text: brief },
          briefStructured: { summary: brief, service: service.name, variant: variant!.name, createdBy: "pm-api" },
          creditsCharged: finalCredits,
          pmNotes: pmNotes || null,
          completedAt: isRetroactive
            ? retroactiveDate
              ? new Date(retroactiveDate)
              : new Date()
            : null,
        },
      });
    });

    if (!isRetroactive) {
      await db.notification
        .create({
          data: {
            userId: client.id,
            title: "New request created",
            message: `Request #${ticket.number} for ${service.name} has been created by your PM.`,
            type: "ticket",
            link: `/tickets/${ticket.id}`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        number: ticket.number,
        status: finalStatus,
        service: service.name,
        variant: variant.name,
        creditsCharged: finalCredits,
        client: { name: client.name, email: client.email },
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg.startsWith("INSUFFICIENT_CREDITS")) {
      return NextResponse.json({ error: msg }, { status: 402 });
    }
    console.error("[pm/tickets/create]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
