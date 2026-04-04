import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const { error, session } = await requireApiRole(["CLIENT", "ADMIN", "PM"]);
  if (error || !session) return error;

  try {
    const { briefStructured, conversationMessages, variantId } = await req.json();

    if (!variantId || !briefStructured) {
      return NextResponse.json(
        { error: "Datos del brief incompletos" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Validate variant exists and is active (C2 + I15)
    const variant = await db.serviceVariant.findUnique({
      where: { id: variantId, isActive: true },
      include: { service: true },
    });

    if (!variant) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 400 });
    }

    // Check min plan before transaction
    const subCheck = await db.subscription.findUnique({ where: { userId }, include: { plan: true } });
    if (variant.minPlan && !subCheck) {
      return NextResponse.json({ error: "Este servicio requiere un plan activo" }, { status: 403 });
    }
    if (variant.minPlan && subCheck) {
      const planOrder = ["member", "growth", "pro"];
      if (planOrder.indexOf(subCheck.plan.slug) < planOrder.indexOf(variant.minPlan)) {
        return NextResponse.json({ error: `Esta variante requiere el plan ${variant.minPlan} o superior` }, { status: 400 });
      }
    }

    // Atomic transaction: validate balance + deduct + create ticket
    const ticket = await db.$transaction(async (tx: any) => {
      // Read fresh balances inside transaction
      const user = await tx.user.findUnique({ where: { id: userId }, select: { freeCredits: true } });
      const subscription = await tx.subscription.findUnique({ where: { userId }, select: { id: true, creditsRemaining: true, status: true } });

      // C6: only use plan credits if subscription is ACTIVE
      const freeCredits = user?.freeCredits || 0;
      const planCredits = (subscription?.status === "ACTIVE" ? subscription.creditsRemaining : 0);
      const totalCredits = freeCredits + planCredits;

      if (totalCredits < variant.creditCost) {
        throw new Error(`INSUFFICIENT_CREDITS:${variant.creditCost}:${totalCredits}`);
      }

      // Deduct: free first, then plan
      let remaining = variant.creditCost;
      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({ where: { id: userId }, data: { freeCredits: { decrement: fromFree } } });
        remaining -= fromFree;
      }

      if (remaining > 0 && subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { creditsRemaining: { decrement: remaining } },
        });
      }

      // Extract pmAlert if present (invisible to client) — sanitize
      const rawAlert = briefStructured?.pmAlert;
      const pmAlert = typeof rawAlert === "string" ? rawAlert.substring(0, 500) : null;

      // Create ticket
      const newTicket = await tx.ticket.create({
        data: {
          userId,
          variantId,
          status: "NEW",
          priority: "NORMAL",
          briefRaw: conversationMessages || [],
          briefStructured,
          creditsCharged: variant.creditCost,
          pmNotes: pmAlert,
        },
      });

      // Save wizard conversation
      await tx.wizardConversation.create({
        data: {
          userId,
          messages: conversationMessages || [],
          suggestedService: variant.service.slug,
          suggestedVariant: variant.id,
          briefGenerated: briefStructured,
          status: "TICKET_CREATED",
        },
      });

      return newTicket;
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        number: ticket.number,
        serviceName: variant.service.name,
        variantName: variant.name,
        creditsCharged: ticket.creditsCharged,
        serviceSlug: variant.service.slug,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("INSUFFICIENT_CREDITS:")) {
      const [, needed, have] = msg.split(":");
      return NextResponse.json({ error: `No tienes suficientes créditos. Necesitas ${needed}, tienes ${have}.` }, { status: 400 });
    }
    console.error("[WIZARD_CREATE_TICKET]", err);
    return NextResponse.json({ error: "Error al crear el ticket" }, { status: 500 });
  }
}
