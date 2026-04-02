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

    // Validate variant exists
    const variant = await db.serviceVariant.findUnique({
      where: { id: variantId },
      include: { service: true },
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Variante de servicio no encontrada" },
        { status: 404 }
      );
    }

    // Validate credits (freeCredits + subscription)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { freeCredits: true },
    });
    const subscription = await db.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const freeCredits = user?.freeCredits || 0;
    const planCredits = subscription?.creditsRemaining || 0;
    const totalCredits = freeCredits + planCredits;

    if (totalCredits < variant.creditCost) {
      return NextResponse.json(
        {
          error: `No tienes suficientes créditos. Necesitas ${variant.creditCost}, tienes ${totalCredits}.`,
        },
        { status: 400 }
      );
    }

    // Check min plan (only if variant requires one)
    if (variant.minPlan && subscription) {
      const planOrder = ["member", "growth", "pro"];
      const userPlanIndex = planOrder.indexOf(subscription.plan.slug);
      const minPlanIndex = planOrder.indexOf(variant.minPlan);
      if (userPlanIndex < minPlanIndex) {
        return NextResponse.json(
          { error: `Esta variante requiere el plan ${variant.minPlan} o superior` },
          { status: 400 }
        );
      }
    }

    // Atomic transaction: create ticket + deduct credits + save conversation
    const ticket = await db.$transaction(async (tx) => {
      // Deduct credits: free first, then plan
      let remaining = variant.creditCost;

      if (freeCredits > 0) {
        const fromFree = Math.min(freeCredits, remaining);
        await tx.user.update({
          where: { id: userId },
          data: { freeCredits: { decrement: fromFree } },
        });
        remaining -= fromFree;
      }

      if (remaining > 0 && subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { creditsRemaining: { decrement: remaining } },
        });
      }

      // Extract pmAlert if present (invisible to client)
      const pmAlert = briefStructured?.pmAlert || null;

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
    console.error("[WIZARD_CREATE_TICKET]", err);
    return NextResponse.json(
      { error: "Error al crear el ticket" },
      { status: 500 }
    );
  }
}
